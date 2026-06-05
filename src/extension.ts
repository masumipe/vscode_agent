import * as vscode from 'vscode';
import { OllamaService } from './services/ollamaService';
import { AgentManager } from './agents/agentManager';
import { ChatCommandHandler } from './gui/chatCommands';
import { OllamaLanguageService } from './utils/ollamaLanguageService';
import { OllamaChatPanel } from './gui/ollamaChatPanel';

export class OllamaExtension {
    private ollamaService: OllamaService;
    private agentManager: AgentManager;
    private languageService: OllamaLanguageService;
    private chatPanel: OllamaChatPanel | null = null;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.ollamaService = new OllamaService();
        this.agentManager = new AgentManager(this.ollamaService);
        this.languageService = new OllamaLanguageService(context);
    }

    public async activate() {
        console.log('Ollama Agent Extension is now active!');

        await this.languageService.initialize();
        this.chatPanel = new OllamaChatPanel(this.ollamaService, this.agentManager, this.context);
        
        // Register chat commands from gui/chatCommands.ts  
        const commandHandler = new ChatCommandHandler(this);
        commandHandler.registerChatCommands(this.context);

        this.provideCustomContext();
        await this.checkOllamaConnection();
        this.registerStatusBarItem(this.context);
    }

    public async deactivate() {
        console.log('Ollama Agent Extension is now deactivated');
        
        if (this.chatPanel) {
            this.chatPanel.dispose();
        }
    }

    private registerStatusBarItem(context: vscode.ExtensionContext) {
        const statusBarItem = vscode.window.createStatusBarItem();
        statusBarItem.text = '$(ai-chat) Ollama Agent';
        statusBarItem.command = 'ollama.agent.status';
        statusBarItem.tooltip = 'Ollama Agent Status';
        context.subscriptions.push(statusBarItem);
    }

    private async checkOllamaConnection() {
        try {
            const serverUrl = vscode.workspace.getConfiguration('ollama').get('serverUrl', 'http://localhost:11434');
            if (!serverUrl || (!serverUrl.startsWith('http://') && !serverUrl.startsWith('https://'))) {
                vscode.window.showErrorMessage(`Invalid Ollama URL: "${serverUrl}".`);
                return;
            }

            const response = await this.ollamaService.healthCheck(serverUrl as string);
            if (response.status === 200) {
                vscode.window.showInformationMessage('Ollama server is connected and ready!');
            } else {
                vscode.window.showErrorMessage('Failed to connect to Ollama server. Please check the server URL.');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Ollama connection error: ${error}`);
        }
    }

    private provideCustomContext() {
        vscode.commands.executeCommand('setContext', 'ollama.enabled', true);
    }
}

let extension: OllamaExtension;

export async function activate(context: vscode.ExtensionContext) {
    extension = new OllamaExtension(context);
    await extension.activate();
}

export async function deactivate() {
    if (extension) {
        await extension.deactivate();
    }
}
