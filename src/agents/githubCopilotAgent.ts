import * as vscode from 'vscode';
import { OllamaService } from '../services/ollamaService';
import * as fs from 'fs';
import * as path from 'path';

/**
 * GitHub Copilot-like AI Agent that can:
 * - Read automatically from editor, terminal, and entire folder
 * - Drive deep to required files for edit, delete, insert codes
 * - Run, test, and debug codes entirely on its own
 * - Requires permission from extension settings
 */
export class GitHubCopilotAgent {
    private ollamaService: OllamaService;
    private context: vscode.ExtensionContext;
    private agentId: string;
    private capabilities: string[];
    private permissions: GitHubCopilotAgentPermissions;

    /**
     * GitHub Copilot-like permissions model
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
    private loadPermissions(): GitHubCopilotAgentPermissions {
        const config = vscode.workspace.getConfiguration('ollama');
        const enabledPermissions: GitHubCopilotAgentPermissions[] = [];

        // Check each permission
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
            const value = config.get(check.key, false);
            if (value === true) {
                enabledPermissions.push(check.value);
            }
        }

        return enabledPermissions[0];
    }

    /**
     * Initialize the agent with GitHub Copilot-like behavior
     */
    async initialize(): Promise<void> {
        console.log(`GitHub Copilot Agent ${this.agentId} initialized`);
        await this.ollamaService.initialize();
    }

    /**
     * Ask the agent to perform a task
     */
    async ask(task: string, context?: any): Promise<string> {
        const prompt = `You are GitHub Copilot - an AI coding assistant that can:
        1. Read automatically from editor, terminal, and entire folder
        2. Drive deep to required files for edit, delete, insert codes
        3. Run, test, and debug codes entirely on its own
        
        Current permissions: ${this.permissions}
        
        Task: ${task}
        Context: ${JSON.stringify(context || {})}
        
        Please provide a step-by-step plan and execute it using the available permissions.`;

        try {
            const response = await this.ollamaService.generate(prompt);
            return response;
        } catch (error) {
            console.error('Agent error:', error);
            return `Error: ${error}`;
        }
    }

    /**
     * Read the current editor content
     */
    async readEditor(): Promise<string> {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            return 'No editor is currently active.';
        }

        const document = activeEditor.document;
        const range = document.selection.active;
        
        let content = '';
        if (range.start.line === range.end.line) {
            content = document.lineAt(range.start.line).getText();
        } else {
            content = document.getText(range);
        }

        return content;
    }

    /**
     * Read the entire file
     */
    async readFile(uri: vscode.Uri): Promise<string> {
        try {
            const bytes = await vscode.workspace.fs.readFile(uri);
            const content = Buffer.from(bytes).toString('utf8');
            return content;
        } catch (error) {
            return `Error reading file: ${error}`;
        }
    }

    /**
     * Read the terminal output
     */
    async readTerminal(terminalName?: string): Promise<string> {
        let terminal = vscode.window.terminals.find(t => t.name === terminalName);
        if (!terminal) {
            terminal = vscode.window.activeTerminal;
        }

        if (!terminal) {
            return 'No terminal found.';
        }

        const output = await terminal.show();
        return output;
    }

    /**
     * Read the entire folder
     */
    async readFolder(folderPath: string): Promise<Map<string, string>> {
        const folderUri = vscode.Uri.file(folderPath);
        const files = new Map<string, string>();

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
        } catch (error) {
            return new Map<string, string>();
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
            return false;
        }
    }

    /**
     * Insert code at a specific location
     */
    async insertCode(
        uri: vscode.Uri,
        position: vscode.Position,
        text: string,
        insertAtBeginning: boolean = true
    ): Promise<boolean> {
        try {
            const document = await vscode.workspace.openTextDocument(uri);
            const editor = await vscode.window.showTextDocument(document);

            const range = new vscode.Range(position, insertAtBeginning ? position : position.translate(0, 1));
            editor.edit((editBuilder) => {
                editBuilder.insert(range, text);
            });

            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Run code in terminal
     */
    async runCode(command: string, cwd?: string): Promise<{ stdout: string; stderr: string; error: boolean }> {
        try {
            const exec = require('child_process').exec;
            const cwdPath = cwd || this.context.workspaceRoot;

            return new Promise((resolve) => {
                exec(command, { cwd: cwdPath }, (error, stdout, stderr) => {
                    resolve({
                        stdout: stdout || '',
                        stderr: stderr || '',
                        error: error !== null
                    });
                });
            });
        } catch (error) {
            return { stdout: '', stderr: String(error), error: true };
        }
    }

    /**
     * Run tests
     */
    async testCode(fileUri: vscode.Uri, testPattern?: string): Promise<{ stdout: string; stderr: string; error: boolean }> {
        const document = await vscode.workspace.openTextDocument(fileUri);
        const fileName = document.fileName;
        
        // Try to find test file
        let testCommand = '';
        if (fileName.endsWith('.ts')) {
            testCommand = 'npx mocha';
        } else if (fileName.endsWith('.py')) {
            testCommand = 'pytest';
        } else if (fileName.endsWith('.js')) {
            testCommand = 'node';
        }

        if (!testCommand) {
            return { stdout: 'No test framework detected', stderr: '', error: false };
        }

        return this.runCode(testCommand);
    }

    /**
     * Debug code
     */
    async debugCode(fileUri: vscode.Uri, debugPattern?: string): Promise<string> {
        const document = await vscode.workspace.openTextDocument(fileUri);
        const fileName = document.fileName;

        // Try to find debugger configuration
        let debugCommand = '';
        if (fileName.endsWith('.ts')) {
            debugCommand = 'npx ts-node --transpile-only';
        } else if (fileName.endsWith('.py')) {
            debugCommand = 'python';
        } else if (fileName.endsWith('.js')) {
            debugCommand = 'node';
        }

        if (!debugCommand) {
            return 'No debugger configuration found';
        }

        return this.runCode(debugCommand);
    }

    /**
     * Browse the web
     */
    async browseWeb(url: string): Promise<string> {
        try {
            const response = await fetch(url);
            const text = await response.text();
            return `Fetched ${url}: ${text.substring(0, 2000)}`;
        } catch (error) {
            return `Error fetching ${url}: ${error}`;
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
    getAvailablePermissions(): GitHubCopilotAgentPermissions[] {
        return this.capabilities;
    }

    /**
     * Check if a permission is enabled
     */
    hasPermission(permission: GitHubCopilotAgentPermissions): boolean {
        return this.permissions === permission;
    }

    /**
     * Get current permissions as string
     */
    getPermissionsString(): string {
        return this.permissions;
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
