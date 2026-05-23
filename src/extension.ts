import * as vscode from 'vscode';
import { OllamaService } from './services/ollamaService';
import { AgentManager } from './agents/agentManager';
import { OllamaLanguageService } from './utils/ollamaLanguageService';

export class OllamaExtension {
    private ollamaService: OllamaService;
    private agentManager: AgentManager;
    private languageService: OllamaLanguageService;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.ollamaService = new OllamaService();
        this.agentManager = new AgentManager(this.ollamaService);
        this.languageService = new OllamaLanguageService(context);
    }

    public async activate(context: vscode.ExtensionContext) {
        console.log('Ollama Agent Extension is now active!');

        // Initialize language service for code completion
        await this.languageService.initialize();

        // Register commands
        this.registerCommands(context);
        
        // Check Ollama server connection
        await this.checkOllamaConnection();
        
        // Register status bar item
        this.registerStatusBarItem(context);
    }

    public async deactivate() {
        console.log('Ollama Agent Extension is now deactivated');
    }

    private registerCommands(context: vscode.ExtensionContext) {
        // Create new agent command
        const createAgentDisposable = vscode.commands.registerCommand(
            'ollama.agent.create',
            async () => {
                const agentName = await vscode.window.showInputBox({
                    prompt: 'Enter agent name',
                    placeHolder: 'e.g., Research Assistant'
                });

                if (agentName) {
                    await this.agentManager.createAgent(agentName);
                    vscode.window.showInformationMessage(`Agent "${agentName}" created successfully!`);
                }
            }
        );

        // Run agent command
        const runAgentDisposable = vscode.commands.registerCommand(
            'ollama.agent.run',
            async () => {
                const agentName = await vscode.window.showInputBox({
                    prompt: 'Enter agent name to run',
                    placeHolder: 'e.g., Research Assistant'
                });

                if (agentName) {
                    await this.agentManager.runAgent(agentName, 'What would you like the agent to do?');
                }
            }
        );

        // Evaluate agent command
        const evaluateAgentDisposable = vscode.commands.registerCommand(
            'ollama.agent.evaluate',
            async () => {
                const agentName = await vscode.window.showInputBox({
                    prompt: 'Enter agent name to evaluate',
                    placeHolder: 'e.g., Research Assistant'
                });

                if (agentName) {
                    await this.agentManager.evaluateAgent(agentName, 'How would you like to evaluate this agent?');
                }
            }
        );

        // Debug agent command
        const debugAgentDisposable = vscode.commands.registerCommand(
            'ollama.agent.debug',
            async () => {
                const agentName = await vscode.window.showInputBox({
                    prompt: 'Enter agent name to debug',
                    placeHolder: 'e.g., Research Assistant'
                });

                if (agentName) {
                    await this.agentManager.debugAgent(agentName, 'What would you like to debug?');
                }
            }
        );

        // Accept completion command
        const acceptCompletionDisposable = vscode.commands.registerCommand(
            'ollama.acceptCompletion',
            async () => {
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    const selection = editor.selection;
                    if (selection.isEmpty) {
                        await vscode.commands.executeCommand('editor.action.inlineSuggest.accept');
                    }
                }
            }
        );

        context.subscriptions.push(
            createAgentDisposable,
            runAgentDisposable,
            evaluateAgentDisposable,
            debugAgentDisposable,
            acceptCompletionDisposable
        );
    }

    private async registerStatusBarItem(context: vscode.ExtensionContext) {
        const statusBarItem = vscode.window.createStatusBarItem();
        statusBarItem.text = '$(ai-chat) Ollama Agent';
        statusBarItem.command = 'ollama.agent.status';
        statusBarItem.tooltip = 'Ollama Agent Status';
        
        context.subscriptions.push(statusBarItem);
    }

    private async checkOllamaConnection() {
        try {
            const serverUrl = vscode.workspace.getConfiguration('ollama').get('serverUrl', 'http://localhost:11434');
            const response = await this.ollamaService.healthCheck(serverUrl);
            
            if (response.status === 200) {
                vscode.window.showInformationMessage('Ollama server is connected and ready!');
            } else {
                vscode.window.showErrorMessage('Failed to connect to Ollama server. Please check the server URL.');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Ollama connection error: ${error}`);
        }
    }
}

// Export the extension class
export default new OllamaExtension(context);
