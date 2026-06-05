import * as vscode from 'vscode';
import { spawn, SpawnOptions, ChildProcess } from 'child_process';
import { Logger } from '../telemetry/logger';

export interface CommandResult {
    stdout: string;
    stderr: string;
    exitCode: number | null;
}

export class TerminalService {
    private logger = Logger.getInstance();
    private terminalBuffers = new Map<string, string>();
    private terminalDisposables: vscode.Disposable[] = [];
    private activeProcesses = new Map<string, ChildProcess>();

    constructor() {
        this.setupTerminalListener();
    }

    private setupTerminalListener(): void {
        try {
            const win = vscode.window as any;
            if (typeof win.onDidWriteTerminalData !== 'function') {
                this.logger.warn('onDidWriteTerminalData not available');
                return;
            }
            const disposable = win.onDidWriteTerminalData((e: { terminal: vscode.Terminal; data: string }) => {
                const termName = e.terminal.name;
                const existing = this.terminalBuffers.get(termName) || '';
                this.terminalBuffers.set(termName, existing + e.data);
            });
            this.terminalDisposables.push(disposable);
        } catch {
            this.logger.warn('onDidWriteTerminalData not available in this VS Code version');
        }
    }

    executeAndCapture(
        command: string,
        cwd?: string,
        options?: { onStdout?: (data: string) => void; onStderr?: (data: string) => void }
    ): Promise<CommandResult> {
        return new Promise((resolve) => {
            const processCwd = cwd || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
            const parts = splitCommand(command);
            const cmd = parts[0];
            const args = parts.slice(1);
            const spawnOpts: SpawnOptions = {
                cwd: processCwd,
                shell: true,
                windowsHide: true,
            };

            const child = spawn(cmd, args, spawnOpts);
            const processId = `spawn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            this.activeProcesses.set(processId, child);

            let stdout = '';
            let stderr = '';

            child.stdout?.on('data', (data: Buffer) => {
                const text = data.toString();
                stdout += text;
                if (options?.onStdout) options.onStdout(text);
            });

            child.stderr?.on('data', (data: Buffer) => {
                const text = data.toString();
                stderr += text;
                if (options?.onStderr) options.onStderr(text);
            });

            child.on('close', (exitCode) => {
                this.activeProcesses.delete(processId);
                resolve({ stdout, stderr, exitCode });
            });

            child.on('error', (err) => {
                this.activeProcesses.delete(processId);
                stderr += `\nProcess error: ${err.message}`;
                resolve({ stdout, stderr, exitCode: -1 });
            });
        });
    }

    createTerminal(name: string): vscode.Terminal {
        const existing = vscode.window.terminals.find(t => t.name === name);
        if (existing) return existing;
        const term = vscode.window.createTerminal({ name });
        this.terminalBuffers.set(name, '');
        return term;
    }

    sendToTerminal(name: string, command: string): void {
        const term = this.createTerminal(name);
        term.show(true);
        term.sendText(command, true);
    }

    getTerminalBuffer(name?: string): string {
        if (name) return this.terminalBuffers.get(name) || '';
        const combined: string[] = [];
        for (const [, buf] of this.terminalBuffers) {
            combined.push(buf);
        }
        return combined.join('\n---\n');
    }

    getTerminalNames(): string[] {
        return Array.from(this.terminalBuffers.keys());
    }

    clearTerminalBuffer(name?: string): void {
        if (name) {
            this.terminalBuffers.set(name, '');
        } else {
            this.terminalBuffers.clear();
        }
    }

    attachToExistingTerminal(terminal: vscode.Terminal): void {
        const name = terminal.name;
        if (!this.terminalBuffers.has(name)) {
            this.terminalBuffers.set(name, '');
        }
    }

    attachToAllExistingTerminals(): void {
        for (const term of vscode.window.terminals) {
            this.attachToExistingTerminal(term);
        }
    }

    cancelRunningProcess(): void {
        for (const [id, child] of this.activeProcesses) {
            if (!child.killed) {
                child.kill('SIGTERM');
                setTimeout(() => {
                    if (!child.killed) child.kill('SIGKILL');
                }, 3000);
            }
            this.activeProcesses.delete(id);
        }
    }

    dispose(): void {
        this.cancelRunningProcess();
        for (const d of this.terminalDisposables) {
            d.dispose();
        }
        this.terminalDisposables = [];
        this.terminalBuffers.clear();
    }
}

function splitCommand(command: string): string[] {
    const trimmed = command.trim();
    if (!trimmed) return [];
    if (process.platform === 'win32') {
        return [trimmed];
    }
    return trimmed.split(/\s+/);
}
