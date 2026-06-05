import * as vscode from 'vscode';
import { ChangeEntry, ChangedRange, computeDiff } from './changeSet';
import { Logger } from '../telemetry/logger';

const ADDED_DECORATION = vscode.window.createTextEditorDecorationType({
    backgroundColor: new vscode.ThemeColor('diffEditor.insertedTextBackground'),
    isWholeLine: true,
    border: '1px solid var(--vscode-diffEditor-insertedTextBorder)',
});

const REMOVED_DECORATION = vscode.window.createTextEditorDecorationType({
    backgroundColor: new vscode.ThemeColor('diffEditor.removedTextBackground'),
    isWholeLine: true,
    border: '1px solid var(--vscode-diffEditor-removedTextBorder)',
});

export type ChangeNotificationCallback = (filePath: string, fileName: string, linesChanged: number, blocks: number, changeIndex: number) => void;

export class ChangeManager {
    private pendingChanges: Map<string, ChangeEntry> = new Map();
    private logger = Logger.getInstance();
    private statusBarItem: vscode.StatusBarItem;
    private changeIndex = 0;
    private onNotify: ChangeNotificationCallback | undefined;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
        this.statusBarItem.command = 'ollama.changes.show';
        this.statusBarItem.tooltip = 'Click to review pending changes';
        this.updateStatusBar();

        vscode.window.onDidChangeVisibleTextEditors(() => {
            this.reapplyDecorations();
        });
    }

    setNotificationCallback(cb: ChangeNotificationCallback): void {
        this.onNotify = cb;
    }

    register(context: vscode.ExtensionContext): void {
        context.subscriptions.push(
            vscode.languages.registerCodeLensProvider(
                { pattern: '**/*' },
                new ChangeCodeLensProvider(this),
            ),
            this.statusBarItem,
            ADDED_DECORATION,
            REMOVED_DECORATION,
        );
    }

    dispose(): void {
        this.clearAll();
        this.statusBarItem.dispose();
    }

    async trackWrite(uri: vscode.Uri, originalContent: string, modifiedContent: string): Promise<ChangeEntry | undefined> {
        if (originalContent === modifiedContent) return undefined;

        const key = uri.toString();
        const existing = this.pendingChanges.get(key);
        if (existing && !existing.accepted && !existing.rejected) {
            existing.currentContent = modifiedContent;
            existing.ranges = computeDiff(uri, existing.originalContent, modifiedContent);
            existing.timestamp = Date.now();
            this.applyDecorations(uri);
            return existing;
        }

        const entry: ChangeEntry = {
            uri,
            timestamp: Date.now(),
            originalContent,
            currentContent: modifiedContent,
            ranges: computeDiff(uri, originalContent, modifiedContent),
            accepted: false,
            rejected: false,
        };
        this.pendingChanges.set(key, entry);
        this.applyDecorations(uri);
        this.updateStatusBar();
        vscode.commands.executeCommand('setContext', 'ollama.hasPendingChanges', true);

        const fileName = entry.uri.fsPath.split(/[\\/]/).pop() || entry.uri.fsPath;
        const linesChanged = entry.ranges.reduce((sum, r) => sum + (r.endLine - r.startLine + 1), 0);
        const changeCount = entry.ranges.length;
        this.changeIndex++;

        // Notify the chat panel
        if (this.onNotify) {
            this.onNotify(entry.uri.fsPath, fileName, linesChanged, changeCount, this.changeIndex);
        }

        return entry;
    }

    async acceptChange(uri: vscode.Uri): Promise<boolean> {
        const key = uri.toString();
        const entry = this.pendingChanges.get(key);
        if (!entry || entry.accepted || entry.rejected) return false;
        entry.accepted = true;
        this.removeDecorations(uri);
        this.pendingChanges.delete(key);
        this.updateStatusBar();
        this.updateContext();
        this.logger.info(`Accepted changes for ${uri.fsPath}`);
        vscode.window.showInformationMessage('Changes accepted.');
        return true;
    }

    async rejectChange(uri: vscode.Uri): Promise<boolean> {
        const key = uri.toString();
        const entry = this.pendingChanges.get(key);
        if (!entry || entry.accepted || entry.rejected) return false;

        try {
            const data = Buffer.from(entry.originalContent, 'utf8');
            await vscode.workspace.fs.writeFile(uri, data);
        } catch (error) {
            this.logger.error('Failed to revert file:', error);
            return false;
        }

        entry.rejected = true;
        this.removeDecorations(uri);
        this.pendingChanges.delete(key);
        this.updateStatusBar();
        this.updateContext();
        this.logger.info(`Rejected changes for ${uri.fsPath}`);
        vscode.window.showInformationMessage('Changes rejected and file reverted.');
        return true;
    }

    async acceptAll(): Promise<number> {
        const keys = Array.from(this.pendingChanges.keys());
        let count = 0;
        for (const key of keys) {
            const entry = this.pendingChanges.get(key);
            if (entry && !entry.accepted && !entry.rejected) {
                entry.accepted = true;
                this.removeDecorations(entry.uri);
                this.pendingChanges.delete(key);
                count++;
            }
        }
        this.updateStatusBar();
        return count;
    }

    async rejectAll(): Promise<number> {
        const keys = Array.from(this.pendingChanges.keys());
        let count = 0;
        for (const key of keys) {
            const entry = this.pendingChanges.get(key);
            if (entry && !entry.accepted && !entry.rejected) {
                const ok = await this.rejectChange(entry.uri);
                if (ok) count++;
            }
        }
        return count;
    }

    getPendingChange(uri: vscode.Uri): ChangeEntry | undefined {
        return this.pendingChanges.get(uri.toString());
    }

    getAllPending(): ChangeEntry[] {
        return Array.from(this.pendingChanges.values()).filter(e => !e.accepted && !e.rejected);
    }

    clearAll(): void {
        for (const key of this.pendingChanges.keys()) {
            const entry = this.pendingChanges.get(key)!;
            if (!entry.accepted && !entry.rejected) {
                this.removeDecorations(entry.uri);
            }
        }
        this.pendingChanges.clear();
        this.updateStatusBar();
    }

    private updateContext(): void {
        const hasPending = this.getAllPending().length > 0;
        vscode.commands.executeCommand('setContext', 'ollama.hasPendingChanges', hasPending);
    }

    // --- Status bar ---

    private updateStatusBar(): void {
        const count = this.getAllPending().length;
        if (count > 0) {
            this.statusBarItem.text = `$(edit) ${count} pending change${count !== 1 ? 's' : ''}`;
            this.statusBarItem.show();
        } else {
            this.statusBarItem.hide();
        }
    }

    // --- Decorations ---

    private decorationData: Map<string, { added: vscode.Range[]; removed: vscode.Range[] }> = new Map();

    private applyDecorations(uri: vscode.Uri): void {
        const entry = this.pendingChanges.get(uri.toString());
        if (!entry) return;

        const added: vscode.Range[] = [];
        const removed: vscode.Range[] = [];

        for (const range of entry.ranges) {
            if (range.originalText === '') {
                added.push(new vscode.Range(range.startLine, 0, range.startLine, 0));
            } else if (range.modifiedText === '') {
                removed.push(new vscode.Range(range.startLine, 0, range.startLine, 0));
            } else {
                added.push(new vscode.Range(range.startLine, 0, range.startLine, 0));
                removed.push(new vscode.Range(range.startLine, 0, range.startLine, 0));
            }
        }

        this.decorationData.set(uri.toString(), { added, removed });
        this.setEditorDecorations(uri, added, removed);
    }

    private removeDecorations(uri: vscode.Uri): void {
        this.decorationData.delete(uri.toString());
        this.setEditorDecorations(uri, [], []);
    }

    private reapplyDecorations(): void {
        for (const editor of vscode.window.visibleTextEditors) {
            const data = this.decorationData.get(editor.document.uri.toString());
            if (data) {
                editor.setDecorations(ADDED_DECORATION, data.added);
                editor.setDecorations(REMOVED_DECORATION, data.removed);
            }
        }
    }

    private setEditorDecorations(uri: vscode.Uri, added: vscode.Range[], removed: vscode.Range[]): void {
        for (const editor of vscode.window.visibleTextEditors) {
            if (editor.document.uri.toString() === uri.toString()) {
                editor.setDecorations(ADDED_DECORATION, added);
                editor.setDecorations(REMOVED_DECORATION, removed);
            }
        }
    }

    // --- CodeLens access for ChangeCodeLensProvider ---

    getEntryForUri(uri: vscode.Uri): ChangeEntry | undefined {
        const entry = this.pendingChanges.get(uri.toString());
        if (!entry || entry.accepted || entry.rejected) return undefined;
        if (entry.ranges.length === 0) return undefined;
        return entry;
    }
}

class ChangeCodeLensProvider implements vscode.CodeLensProvider {
    private manager: ChangeManager;

    constructor(manager: ChangeManager) {
        this.manager = manager;
    }

    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
        const entry = this.manager.getEntryForUri(document.uri);
        if (!entry) return [];

        const firstLine = entry.ranges[0].startLine;
        const lastLine = entry.ranges[entry.ranges.length - 1].endLine;

        const lenses: vscode.CodeLens[] = [
            new vscode.CodeLens(
                new vscode.Range(firstLine, 0, firstLine, 0),
                {
                    title: '$(check) Accept Changes',
                    command: 'ollama.changes.accept',
                    arguments: [document.uri],
                },
            ),
            new vscode.CodeLens(
                new vscode.Range(firstLine, 0, firstLine, 0),
                {
                    title: '$(x) Reject Changes',
                    command: 'ollama.changes.reject',
                    arguments: [document.uri],
                },
            ),
        ];

        if (this.manager.getAllPending().length > 1) {
            lenses.push(new vscode.CodeLens(
                new vscode.Range(lastLine, 0, lastLine, 0),
                {
                    title: '$(check-all) Accept All',
                    command: 'ollama.changes.acceptAll',
                },
            ));
            lenses.push(new vscode.CodeLens(
                new vscode.Range(lastLine, 0, lastLine, 0),
                {
                    title: '$(x) Reject All',
                    command: 'ollama.changes.rejectAll',
                },
            ));
        }

        return lenses;
    }
}
