import * as vscode from 'vscode';
import { OllamaService } from '../services/ollamaService';
import * as path from 'path';

/**
 * GitHub Copilot-like AI Agent that can:
 * - Read from editor, terminal, and folder
 * - Edit, delete, insert code
 * - Run, test, and debug code when permitted
 */
export class GitHubCopilotAgent {
    private ollamaService: OllamaService;
    private context: vscode.ExtensionContext;
    private agentId: string;
    private capabilities: string[];
    private permissions: Set<GitHubCopilotAgentPermissions>;

    constructor(ollamaService: OllamaService, context: vscode.ExtensionContext) {
        this.ollamaService = ollamaService;
        this.context = context;
        this.agentId = `github-copilot-${Date.now()}`;
        this.capabilities = [
            'readEditor',
            'readTerminal',
            'readFolder',
            'writeFile',
            'deleteFile',
            'insertCode',
            'runCode',
            'testCode',
            'debugCode',
            'browseWeb',
            'executeCommand'
        ];
        this.permissions = this.loadPermissions();
    }

    /**
     * Load permissions from extension settings
     */
    private loadPermissions(): Set<GitHubCopilotAgentPermissions> {
        const config = vscode.workspace.getConfiguration('ollama');
        const perms = new Set<GitHubCopilotAgentPermissions>();

        const permissionChecks = [
            { key: 'githubCopilot.readEditor', value: GitHubCopilotAgentPermissions.ReadEditor },
            { key: 'githubCopilot.readTerminal', value: GitHubCopilotAgentPermissions.ReadTerminal },
            { key: 'githubCopilot.readFolder', value: GitHubCopilotAgentPermissions.ReadFolder },
            { key: 'githubCopilot.writeFile', value: GitHubCopilotAgentPermissions.WriteFile },
            { key: 'githubCopilot.deleteFile', value: GitHubCopilotAgentPermissions.DeleteFile },
            { key: 'githubCopilot.insertCode', value: GitHubCopilotAgentPermissions.InsertCode },
            { key: 'githubCopilot.runCode', value: GitHubCopilotAgentPermissions.RunCode },
            { key: 'githubCopilot.testCode', value: GitHubCopilotAgentPermissions.TestCode },
            { key: 'githubCopilot.debugCode', value: GitHubCopilotAgentPermissions.DebugCode },
            { key: 'githubCopilot.browseWeb', value: GitHubCopilotAgentPermissions.BrowseWeb },
            { key: 'githubCopilot.executeCommand', value: GitHubCopilotAgentPermissions.ExecuteCommand }
        ];

        for (const check of permissionChecks) {
            const enabled = config.get<boolean>(check.key, false);
            if (enabled) {
                perms.add(check.value);
            }
        }

        return perms;
    }

    /**
     * Initialize the agent with GitHub Copilot-like behavior
     */
    async initialize(): Promise<void> {
        console.log(`GitHub Copilot Agent ${this.agentId} initialized`);
    }

    /**
     * Ask the agent to perform a task
     */
    async ask(task: string, context?: any): Promise<string> {
        const currentPermissions = Array.from(this.permissions).join(', ') || 'none';
        const prompt = 'You are GitHub Copilot - an AI coding assistant that can:\n' +
            '1. Read from editor, terminal, and folder\n' +
            '2. Edit and modify files when permitted\n' +
            '3. Run, test, and debug code when allowed\n\n' +
            `Current permissions: ${currentPermissions}\n\n` +
            `Task: ${task}\n` +
            `Context: ${JSON.stringify(context || {})}\n\n` +
            'Provide a step-by-step plan and, where appropriate, the exact changes or commands to execute.';

        try {
            const model = vscode.workspace.getConfiguration('ollama').get('defaultModel', 'llama3.2');
            const response = await this.ollamaService.generate(prompt, model as string);
            return response;
        } catch (error) {
            console.error('Agent error:', error);
            return `Error: ${String(error)}`;
        }
    }

    /**
     * Read the current editor content (selection or current line)
     */
    async readEditor(): Promise<string> {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) return 'No editor is currently active.';

        const document = activeEditor.document;
        const selection = activeEditor.selection;

        if (selection.isEmpty) {
            return document.lineAt(selection.active.line).text;
        }

        return document.getText(selection);
    }

    /**
     * Read the entire file
     */
    async readFile(uri: vscode.Uri): Promise<string> {
        try {
            const bytes = await vscode.workspace.fs.readFile(uri);
            return Buffer.from(bytes).toString('utf8');
        } catch (error) {
            return `Error reading file: ${String(error)}`;
        }
    }

    /**
     * Read terminal output (not supported by VS Code API)
     */
    async readTerminal(_terminalName?: string): Promise<string> {
        return 'Reading terminal output is not supported by the VS Code extension API.';
    }

    /**
     * Read the entire folder recursively
     */
    async readFolder(folderPath: string): Promise<Map<string, any>> {
        const folderUri = vscode.Uri.file(folderPath);
        const files = new Map<string, any>();

        try {
            const entries = await vscode.workspace.fs.readDirectory(folderUri);

            for (const [name, entryType] of entries) {
                if (entryType === vscode.FileType.File) {
                    const fileUri = vscode.Uri.joinPath(folderUri, name);
                    const content = await this.readFile(fileUri);
                    files.set(name, content);
                } else if (entryType === vscode.FileType.Directory) {
                    const subFolderPath = path.join(folderPath, name);
                    const subFiles = await this.readFolder(subFolderPath);
                    files.set(name, subFiles);
                }
            }
        } catch (error) {
            console.error('readFolder error:', error);
        }

        return files;
    }

    /**
     * Write to a file
     */
    async writeFile(uri: vscode.Uri, content: string): Promise<boolean> {
        try {
            const data = Buffer.from(content, 'utf8');
            await vscode.workspace.fs.writeFile(uri, data);
            return true;
        } catch (error) {
            console.error('writeFile error:', error);
            return false;
        }
    }

    /**
     * Delete a file
     */
    async deleteFile(uri: vscode.Uri, recursive: boolean = false): Promise<boolean> {
        try {
            await vscode.workspace.fs.delete(uri, { recursive });
            return true;
        } catch (error) {
            console.error('deleteFile error:', error);
            return false;
        }
    }

    /**
     * Insert code at a specific location
     */
    async insertCode(
        uri: vscode.Uri,
        position: vscode.Position,
        text: string
    ): Promise<boolean> {
        try {
            const document = await vscode.workspace.openTextDocument(uri);
            const editor = await vscode.window.showTextDocument(document);

            const success = await editor.edit(editBuilder => {
                editBuilder.insert(position, text);
            });

            return success;
        } catch (error) {
            console.error('insertCode error:', error);
            return false;
        }
    }

    /**
     * Run code in terminal
     */
    async runCode(command: string, cwd?: string): Promise<{ stdout: string; stderr: string; error: boolean }> {
        try {
            const exec = require('child_process').exec;
            const cwdPath = cwd || (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0]?.uri.fsPath) || process.cwd();

            return await new Promise((resolve) => {
                exec(command, { cwd: cwdPath }, (error: any, stdout: string, stderr: string) => {
                    resolve({ stdout: stdout || '', stderr: stderr || '', error: error != null });
                });
            });
        } catch (error) {
            console.error('runCode error:', error);
            return { stdout: '', stderr: String(error), error: true };
        }
    }

    /**
     * Run tests
     */
    async testCode(fileUri: vscode.Uri): Promise<{ stdout: string; stderr: string; error: boolean }> {
        const document = await vscode.workspace.openTextDocument(fileUri);
        const fileName = document.fileName;

        let testCommand = '';
        if (fileName.endsWith('.ts')) {
            testCommand = `npx mocha ${fileName}`;
        } else if (fileName.endsWith('.py')) {
            testCommand = `pytest ${fileName}`;
        } else if (fileName.endsWith('.js')) {
            testCommand = `node ${fileName}`;
        }

        if (!testCommand) return { stdout: 'No test framework detected', stderr: '', error: false };
        return this.runCode(testCommand);
    }

    /**
     * Debug code
     */
    async debugCode(fileUri: vscode.Uri): Promise<string> {
        const document = await vscode.workspace.openTextDocument(fileUri);
        const fileName = document.fileName;

        let debugCommand = '';
        if (fileName.endsWith('.ts')) {
            debugCommand = `npx ts-node --transpile-only ${fileName}`;
        } else if (fileName.endsWith('.py')) {
            debugCommand = `python ${fileName}`;
        } else if (fileName.endsWith('.js')) {
            debugCommand = `node ${fileName}`;
        }

        if (!debugCommand) return 'No debugger configuration found';

        const result = await this.runCode(debugCommand);
        return result.stdout;
    }

    /**
     * Browse the web (open external browser)
     */
    async browseWeb(url: string): Promise<string> {
        try {
            await vscode.env.openExternal(vscode.Uri.parse(url));
            return `Opened ${url} in external browser`;
        } catch (error) {
            console.error('browseWeb error:', error);
            return `Error browsing ${url}: ${String(error)}`;
        }
    }

    /**
     * Execute a command
     */
    async executeCommand(command: string, cwd?: string): Promise<{ stdout: string; stderr: string; error: boolean }> {
        return this.runCode(command, cwd);
    }

    /**
     * Get available permissions
     */
    getAvailablePermissions(): string[] {
        return this.capabilities;
    }

    /**
     * Check if a permission is enabled
     */
    hasPermission(permission: GitHubCopilotAgentPermissions): boolean {
        return this.permissions.has(permission);
    }

    /**
     * Get current permissions as string
     */
    getPermissionsString(): string {
        const arr = Array.from(this.permissions);
        return arr.length > 0 ? arr.join(', ') : 'none';
    }
}

/**
 * GitHub Copilot-like permissions enum
 */
export enum GitHubCopilotAgentPermissions {
    ReadEditor = 'readEditor',
    ReadTerminal = 'readTerminal',
    ReadFolder = 'readFolder',
    WriteFile = 'writeFile',
    DeleteFile = 'deleteFile',
    InsertCode = 'insertCode',
    RunCode = 'runCode',
    TestCode = 'testCode',
    DebugCode = 'debugCode',
    BrowseWeb = 'browseWeb',
    ExecuteCommand = 'executeCommand'
}
