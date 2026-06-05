import * as vscode from 'vscode';
import { OllamaService } from '../services/ollamaService';
import { ConfigService } from '../services/configService';
import { AgentManager } from '../agents/agentManager';
import { CopilotAgent } from '../agents/copilotAgent';
import { ChatPanel } from '../gui/chatPanel';
import { CommandRegistrar } from './commandRegistrar';
import { StatusBarManager } from './statusBarManager';
import { LanguageService } from '../language/languageService';
import { Logger } from '../telemetry/logger';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    const logger = Logger.getInstance();
    logger.info('Ollama Agent Extension activating...');

    const configService = ConfigService.getInstance();
    const ollamaService = new OllamaService();
    const agentManager = new AgentManager(ollamaService);
    const copilotAgent = new CopilotAgent(ollamaService);
    const chatPanel = new ChatPanel(ollamaService, agentManager, context);
    const commandRegistrar = new CommandRegistrar(ollamaService, agentManager, copilotAgent, chatPanel);
    const statusBar = new StatusBarManager();
    const languageService = new LanguageService();

    commandRegistrar.registerAll(context);
    statusBar.register(context);

    languageService.initialize(context);
    languageService.registerCompletionProvider(context);
    languageService.registerHoverProvider(context);

    vscode.commands.executeCommand('setContext', 'ollama.enabled', true);

    await checkConnection(ollamaService);
    logger.info('Ollama Agent Extension activated');
}

export async function deactivate(): Promise<void> {
    Logger.getInstance().info('Ollama Agent Extension deactivated');
}

async function checkConnection(ollamaService: OllamaService): Promise<void> {
    try {
        const response = await ollamaService.healthCheck();
        if (response.status === 200) {
            vscode.window.showInformationMessage('Ollama server is connected and ready!');
        } else {
            vscode.window.showErrorMessage('Failed to connect to Ollama server.');
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Ollama connection error: ${error}`);
    }
}
