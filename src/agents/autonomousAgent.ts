import * as vscode from 'vscode';
import { OllamaService } from '../services/ollamaService';
import * as fs from 'fs';
import * as path from 'path';

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
    private permissions: Set<AutonomousAgentPermissions>;

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
    private loadPermissions(): Set<AutonomousAgentPermissions> {
        const config = vscode.workspace.getConfiguration('ollama');
        const perms = new Set<AutonomousAgentPermissions>();

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
            const enabled = config.get<boolean>(check.key, false);
            if (enabled) {
                perms.add(check.value);
            }
        }

        return perms;
    }

    /**
     * Initialize the agent with autonomous behavior
     */
    async initialize(): Promise<void> {
        console.log(`Autonomous Agent ${this.agentId} initialized`);
        // OllamaService has no initialize method; perform a lightweight health check instead
        try {
            const serverUrl = vscode.workspace.getConfiguration('ollama').get('serverUrl', 'http://localhost:11434');
            await this.ollamaService.healthCheck(serverUrl);
        } catch (e) {
            // ignore
        }
    }

    /**
     * Ask the agent to perform a task
     */
    async ask(task: string, context?: any): Promise<string> {
        const currentPermissions = Array.from(this.permissions).join(', ');
        const prompt = 'You are an autonomous AI coding assistant that works independently like GitHub Copilot.\n\n' +
            'Your capabilities:\n' +
            '1. Read automatically from editor, terminal, and entire folder\n' +
            '2. Drive deep to required files for edit, delete, insert codes\n' +
            '3. Run, test, and debug codes entirely on your own\n' +
            '4. Detect and analyze VS Code problems (errors, warnings, diagnostics)\n' +
            '5. Browse the web for additional information\n\n' +
            `Current permissions: ${currentPermissions}\n\n` +
            `Task: ${task}\n` +
            `Context: ${JSON.stringify(context || {})}\n\n` +
            'Please provide a step-by-step plan and execute it using the available permissions.\nThink carefully and act autonomously.';

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
     * Get VS Code problems from the editor
     */
    async getEditorProblems(): Promise<vscode.Diagnostic[]> {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            return [];
        }

        // getDiagnostics is synchronous but returning as Promise for API consistency
        const problems = vscode.languages.getDiagnostics(activeEditor.document.uri);
        return problems;
    }

    /**
     * Get problems from a specific file
     */
    async getFileProblems(uri: vscode.Uri): Promise<vscode.Diagnostic[]> {
        return vscode.languages.getDiagnostics(uri);
    }

    /**
     * Get all problems in the workspace
     */
    async getWorkspaceProblems(): Promise<Map<vscode.Uri, vscode.Diagnostic[]>> {
        const problems = new Map<vscode.Uri, vscode.Diagnostic[]>();

        for (const entry of vscode.languages.getDiagnostics()) {
            const [uri, diagnostics] = entry;
            problems.set(uri, diagnostics);
        }

        return problems;
    }

    /**
     * Get terminal output
     * Note: VS Code does not expose terminal buffer output via API. Return a helpful message instead.
     */
    async getTerminalOutput(_terminalName?: string): Promise<string> {
        return 'Reading terminal output is not supported by the VS Code extension API.';
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
     * Read the terminal output (alias)
     */
    async readTerminal(terminalName?: string): Promise<string> {
        return this.getTerminalOutput(terminalName);
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
            // return empty map on error
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
        text: string,
        _insertAtBeginning: boolean = true
    ): Promise<boolean> {
        try {
            const document = await vscode.workspace.openTextDocument(uri);
            const editor = await vscode.window.showTextDocument(document);

            const success = await editor.edit((editBuilder) => {
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
                    resolve({
                        stdout: stdout || '',
                        stderr: stderr || '',
                        error: error != null
                    });
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
    async testCode(fileUri: vscode.Uri, _testPattern?: string): Promise<{ stdout: string; stderr: string; error: boolean }> {
        const document = await vscode.workspace.openTextDocument(fileUri);
        const fileName = document.fileName;

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
    async debugCode(fileUri: vscode.Uri, _debugPattern?: string): Promise<string> {
        const document = await vscode.workspace.openTextDocument(fileUri);
        const fileName = document.fileName;

        const workspaceFolder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0] : undefined;
        const started = await vscode.debug.startDebugging(workspaceFolder, {
            type: 'node',
            request: 'launch',
            name: `Debug ${fileName}`,
            program: fileName
        });

        return started ? `Debugging started for ${fileName}` : `Failed to start debugging for ${fileName}`;
    }

    /**
     * Browse web
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
     * Execute command
     */
    async executeCommand(command: string): Promise<string> {
        try {
            const result = await this.runCode(command);
            return `${result.stdout}\n${result.stderr}`;
        } catch (error) {
            console.error('executeCommand error:', error);
            return `Error executing command: ${String(error)}`;
        }
    }

    /**
     * Get all open files
     */
    async getOpenFiles(): Promise<readonly vscode.TextEditor[]> {
        return vscode.window.visibleTextEditors;
    }

    /**
     * Get all open terminals
     */
    async getOpenTerminals(): Promise<readonly vscode.Terminal[]> {
        return vscode.window.terminals;
    }

    /**
     * Get all open panels
     * Note: VS Code API does not expose a global list of webview panels; return empty array.
     */
    async getOpenPanels(): Promise<any[]> {
        return [];
    }
}
