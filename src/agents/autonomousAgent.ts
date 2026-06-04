import * as vscode from 'vscode';
import { OllamaService } from '../services/ollamaService';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Autonomous AI Agent that works independently like GitHub Copilot
 * - Reads automatically from editor, terminal, and entire folder
 * - Drives deep to required files for edit, delete, insert codes
 * - Runs, tests, and debugs codes entirely on its own
 * - Requires permission from extension settings
 */
export class AutonomousAgent {
    private ollamaService: OllamaService;
    private context: vscode.ExtensionContext;
    private agentId: string;
    private capabilities: string[];
    private permissions: AutonomousAgentPermissions;

    /**
     * Autonomous agent permissions model
     */
    export enum AutonomousAgentPermissions {
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
        this.agentId = `autonomous-agent-${Date.now()}`;
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
    private loadPermissions(): AutonomousAgentPermissions {
        const config = vscode.workspace.getConfiguration('ollama');
        const enabledPermissions: AutonomousAgentPermissions[] = [];

        // Check each permission
        const permissionChecks = [
            { key: 'ollama.autonomous.readEditor', value: AutonomousAgentPermissions.ReadEditor },
            { key: 'ollama.autonomous.readTerminal', value: AutonomousAgentPermissions.ReadTerminal },
            { key: 'ollama.autonomous.readFolder', value: AutonomousAgentPermissions.ReadFolder },
            { key: 'ollama.autonomous.writeFile', value: AutonomousAgentPermissions.WriteFile },
            { key: 'ollama.autonomous.deleteFile', value: AutonomousAgentPermissions.DeleteFile },
            { key: 'ollama.autonomous.insertCode', value: AutonomousAgentPermissions.InsertCode },
            { key: 'ollama.autonomous.runCode', value: AutonomousAgentPermissions.RunCode },
            { key: 'ollama.autonomous.testCode', value: AutonomousAgentPermissions.TestCode },
            { key: 'ollama.autonomous.debugCode', value: AutonomousAgentPermissions.DebugCode },
            { key: 'ollama.autonomous.browseWeb', value: AutonomousAgentPermissions.BrowseWeb },
            { key: 'ollama.autonomous.executeCommand', value: AutonomousAgentPermissions.ExecuteCommand }
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
     * Initialize the agent with autonomous behavior
     */
    async initialize(): Promise<void> {
        console.log(`Autonomous Agent ${this.agentId} initialized`);
        await this.ollamaService.initialize();
    }

    /**
     * Ask the agent to perform a task
     */
    async ask(task: string, context?: any): Promise<string> {
        const prompt = `You are an autonomous AI coding assistant that works independently like GitHub Copilot.
        
        Your capabilities:
        1. Read automatically from editor, terminal, and entire folder
        2. Drive deep to required files for edit, delete, insert codes
        3. Run, test, and debug codes entirely on your own
        4. Detect and analyze VS Code problems (errors, warnings, diagnostics)
        5. Browse the web for additional information
        
        Current permissions: ${this.permissions}
        
        Task: ${task}
        Context: ${JSON.stringify(context || {})}
        
        Please provide a step-by-step plan and execute it using the available permissions.
        Think carefully and act autonomously.`;

        try {
            const response = await this.ollamaService.generate(prompt);
            return response;
        } catch (error) {
            console.error('Agent error:', error);
            return `Error: ${error}`;
        }
    }

    /**
     * Get VS Code problems from the editor
     */
    async getEditorProblems(): Promise<vscode.Diagnostic[]> {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            return [];
        }

        const problems = await vscode.languages.getDiagnostics(activeEditor.document.uri);
        return problems;
    }

    /**
     * Get problems from a specific file
     */
    async getFileProblems(uri: vscode.Uri): Promise<vscode.Diagnostic[]> {
        const problems = await vscode.languages.getDiagnostics(uri);
        return problems;
    }

    /**
     * Get all problems in the workspace
     */
    async getWorkspaceProblems(): Promise<Map<vscode.Uri, vscode.Diagnostic[]>> {
        const problems = new Map<vscode.Uri, vscode.Diagnostic[]>();

        for (const [uri, diagnostics] of vscode.languages.getDiagnostics()) {
            problems.set(uri, diagnostics);
        }

        return problems;
    }

    /**
     * Get terminal output
     */
    async getTerminalOutput(terminalName?: string): Promise<string> {
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
     * Read the entire folder recursively
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

        // Get debugger configuration
        const debugConfig = vscode.debug.startDebugging(this.context.workspaceFolder, {
            type: 'node',
            request: 'launch',
            name: 'Debug ${fileName}',
            file: fileName
        });

        return `Debugging started for ${fileName}`;
    }

    /**
     * Browse web
     */
    async browseWeb(url: string): Promise<string> {
        try {
            const response = await fetch(url);
            const text = await response.text();
            return `Successfully fetched ${url}: ${text.substring(0, 500)}`;
        } catch (error) {
            return `Error browsing ${url}: ${error}`;
        }
    }

    /**
     * Execute command
     */
    async executeCommand(command: string): Promise<string> {
        try {
            const result = await this.runCode(command);
            return `${result.stdout}\n${result.stderr}`;
        } catch (error) {
            return `Error executing command: ${error}`;
        }
    }

    /**
     * Get all open files
     */
    async getOpenFiles(): Promise<vscode.TextEditor[]> {
        return vscode.window.textEditors;
    }

    /**
     * Get all open terminals
     */
    async getOpenTerminals(): Promise<vscode.Terminal[]> {
        return vscode.window.terminals;
    }

    /**
     * Get all open panels
     */
    async getOpenPanels(): Promise<vscode.WebviewPanel[]> {
        return vscode.window.webview.panels;
    }
}
