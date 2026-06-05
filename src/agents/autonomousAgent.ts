import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as path from 'path';
import { OllamaService } from '../services/ollamaService';
import { ConfigService } from '../services/configService';
import { AgentPermission, loadPermissions, getPermissionNames } from './permissions';
import { ChangeManager } from '../changes/changeManager';
import { AutonomousLoop } from './autonomousLoop';
import { TerminalService } from '../services/terminalService';
import { DependencyTracer } from '../services/dependencyTracer';
import { BrowserService } from '../services/browserService';
import { Logger } from '../telemetry/logger';

export class AutonomousAgent {
    protected ollamaService: OllamaService;
    protected configService = ConfigService.getInstance();
    protected logger = Logger.getInstance();
    protected changeManager: ChangeManager;
    protected autonomousLoop: AutonomousLoop | undefined;
    private agentId: string;
    private permissions: Set<AgentPermission>;
    private configPrefix: string;

    constructor(
        ollamaService: OllamaService,
        changeManager: ChangeManager,
        configPrefix: string = 'ollama.autonomous',
        autonomousLoop?: AutonomousLoop,
    ) {
        this.ollamaService = ollamaService;
        this.changeManager = changeManager;
        this.autonomousLoop = autonomousLoop;
        this.agentId = `${configPrefix.replace(/\./g, '-')}-${Date.now()}`;
        this.configPrefix = configPrefix;
        this.permissions = loadPermissions(configPrefix);
    }

    async initialize(): Promise<void> {
        this.logger.info(`Agent ${this.agentId} initialized`);
        try {
            await this.ollamaService.healthCheck();
        } catch {
            // ignore health check failures
        }
    }

    async ask(task: string, context?: unknown): Promise<string> {
        const currentPermissions = getPermissionNames(this.permissions);
        const systemPrompt = [
            'You are an autonomous AI coding assistant that works independently like GitHub Copilot.',
            '',
            'Your capabilities:',
            '1. Read automatically from editor, terminal, and entire folder',
            '2. Drive deep to required files for edit, delete, insert codes',
            '3. Run, test, and debug codes entirely on your own',
            '4. Detect and analyze VS Code problems (errors, warnings, diagnostics)',
            '5. Browse the web for additional information',
            '',
            `Current permissions: ${currentPermissions}`,
            '',
            `Task: ${task}`,
            `Context: ${JSON.stringify(context || {})}`,
            '',
            'Please provide a step-by-step plan and execute it using the available permissions.',
            'Think carefully and act autonomously.',
        ].join('\n');

        try {
            const response = await this.ollamaService.generate(systemPrompt);
            return response;
        } catch (error) {
            this.logger.error('Agent error:', error);
            return `Error: ${String(error)}`;
        }
    }

    async getEditorProblems(): Promise<vscode.Diagnostic[]> {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) return [];
        return vscode.languages.getDiagnostics(activeEditor.document.uri);
    }

    async getFileProblems(uri: vscode.Uri): Promise<vscode.Diagnostic[]> {
        return vscode.languages.getDiagnostics(uri);
    }

    async getWorkspaceProblems(): Promise<Map<vscode.Uri, vscode.Diagnostic[]>> {
        const problems = new Map<vscode.Uri, vscode.Diagnostic[]>();
        for (const [uri, diagnostics] of vscode.languages.getDiagnostics()) {
            problems.set(uri, diagnostics);
        }
        return problems;
    }

    async readEditor(): Promise<string> {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) return 'No editor is currently active.';
        const { document, selection } = activeEditor;
        if (selection.isEmpty) return document.lineAt(selection.active.line).text;
        return document.getText(selection);
    }

    async readFile(uri: vscode.Uri): Promise<string> {
        try {
            const bytes = await vscode.workspace.fs.readFile(uri);
            return Buffer.from(bytes).toString('utf8');
        } catch (error) {
            return `Error reading file: ${String(error)}`;
        }
    }

    async readFolder(folderPath: string): Promise<Map<string, unknown>> {
        const folderUri = vscode.Uri.file(folderPath);
        const files = new Map<string, unknown>();
        try {
            const entries = await vscode.workspace.fs.readDirectory(folderUri);
            for (const [name, entryType] of entries) {
                if (entryType === vscode.FileType.File) {
                    const fileUri = vscode.Uri.joinPath(folderUri, name);
                    const content = await this.readFile(fileUri);
                    files.set(name, content);
                } else if (entryType === vscode.FileType.Directory) {
                    const subFiles = await this.readFolder(path.join(folderPath, name));
                    files.set(name, subFiles);
                }
            }
        } catch {
            // return partial results on error
        }
        return files;
    }

    async writeFile(uri: vscode.Uri, content: string): Promise<boolean> {
        try {
            let originalContent = '';
            try {
                const bytes = await vscode.workspace.fs.readFile(uri);
                originalContent = Buffer.from(bytes).toString('utf8');
            } catch {
                // file doesn't exist yet — new file
            }
            const data = Buffer.from(content, 'utf8');
            await vscode.workspace.fs.writeFile(uri, data);
            if (originalContent) {
                this.changeManager.trackWrite(uri, originalContent, content);
            }
            return true;
        } catch (error) {
            this.logger.error('writeFile error:', error);
            return false;
        }
    }

    async deleteFile(uri: vscode.Uri, recursive: boolean = false): Promise<boolean> {
        try {
            await vscode.workspace.fs.delete(uri, { recursive });
            return true;
        } catch (error) {
            this.logger.error('deleteFile error:', error);
            return false;
        }
    }

    async insertCode(uri: vscode.Uri, position: vscode.Position, text: string): Promise<boolean> {
        try {
            const document = await vscode.workspace.openTextDocument(uri);
            const originalContent = document.getText();
            const editor = await vscode.window.showTextDocument(document);
            const success = await editor.edit((editBuilder) => {
                editBuilder.insert(position, text);
            });
            if (success) {
                const modifiedContent = document.getText();
                this.changeManager.trackWrite(uri, originalContent, modifiedContent);
            }
            return success;
        } catch (error) {
            this.logger.error('insertCode error:', error);
            return false;
        }
    }

    async runCode(command: string, cwd?: string): Promise<{ stdout: string; stderr: string; error: boolean }> {
        try {
            const cwdPath = cwd || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
            return await new Promise((resolve) => {
                exec(command, { cwd: cwdPath }, (err, stdout, stderr) => {
                    resolve({ stdout: stdout || '', stderr: stderr || '', error: err != null });
                });
            });
        } catch (error) {
            this.logger.error('runCode error:', error);
            return { stdout: '', stderr: String(error), error: true };
        }
    }

    async testCode(fileUri: vscode.Uri): Promise<{ stdout: string; stderr: string; error: boolean }> {
        const document = await vscode.workspace.openTextDocument(fileUri);
        const fileName = document.fileName;
        let testCommand = '';
        if (fileName.endsWith('.ts')) testCommand = 'npx mocha';
        else if (fileName.endsWith('.py')) testCommand = 'pytest';
        else if (fileName.endsWith('.js')) testCommand = 'node';
        if (!testCommand) return { stdout: 'No test framework detected', stderr: '', error: false };
        return this.runCode(testCommand);
    }

    async debugCode(fileUri: vscode.Uri): Promise<string> {
        const document = await vscode.workspace.openTextDocument(fileUri);
        const fileName = document.fileName;
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const started = await vscode.debug.startDebugging(workspaceFolder, {
            type: 'node',
            request: 'launch',
            name: `Debug ${fileName}`,
            program: fileName,
        });
        return started ? `Debugging started for ${fileName}` : `Failed to start debugging for ${fileName}`;
    }

    async browseWeb(url: string): Promise<string> {
        try {
            await vscode.env.openExternal(vscode.Uri.parse(url));
            return `Opened ${url} in external browser`;
        } catch (error) {
            return `Error browsing ${url}: ${String(error)}`;
        }
    }

    async executeCommand(command: string): Promise<string> {
        try {
            const result = await this.runCode(command);
            return `${result.stdout}\n${result.stderr}`;
        } catch (error) {
            return `Error executing command: ${String(error)}`;
        }
    }

    async fixTask(task: string, command?: string): Promise<string> {
        if (!this.autonomousLoop) {
            return 'Error: Autonomous loop not configured. Add ollama.serverUrl, ollama.defaultModel settings and restart.';
        }
        try {
            const result = await this.autonomousLoop.run(task, command);
            if (result.success) {
                return `Successfully fixed after ${result.iterations} iteration(s). Modified files: ${result.filesModified.join(', ') || 'none'}`;
            }
            return `Failed after ${result.iterations} iteration(s): ${result.finalOutput}`;
        } catch (error) {
            return `Fix task error: ${String(error)}`;
        }
    }

    hasPermission(permission: AgentPermission): boolean {
        return this.permissions.has(permission);
    }

    getPermissionsString(): string {
        return getPermissionNames(this.permissions);
    }

    getAgentId(): string {
        return this.agentId;
    }
}
