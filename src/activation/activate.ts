import * as vscode from 'vscode';
import { OllamaService } from '../services/ollamaService';
import { ConfigService } from '../services/configService';
import { TerminalService } from '../services/terminalService';
import { DependencyTracer } from '../services/dependencyTracer';
import { BrowserService } from '../services/browserService';
import { AgentManager } from '../agents/agentManager';
import { CopilotAgent } from '../agents/copilotAgent';
import { AutonomousLoop } from '../agents/autonomousLoop';
import { ChangeManager } from '../changes/changeManager';
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
    const changeManager = new ChangeManager();

    // New services
    const terminalService = new TerminalService();
    const dependencyTracer = new DependencyTracer();
    const browserService = new BrowserService();
    const autonomousLoop = new AutonomousLoop(ollamaService, terminalService, dependencyTracer, browserService, changeManager);

    const copilotAgent = new CopilotAgent(ollamaService, changeManager, autonomousLoop);
    const chatPanel = new ChatPanel(ollamaService, agentManager, changeManager, context, autonomousLoop);
    changeManager.setNotificationCallback((filePath, fileName, linesChanged, blocks, changeIndex) => {
        chatPanel.notifyChange(filePath, fileName, linesChanged, blocks, changeIndex);
    });
    const commandRegistrar = new CommandRegistrar(ollamaService, agentManager, copilotAgent, changeManager, chatPanel, autonomousLoop);
    const statusBar = new StatusBarManager();
    const languageService = new LanguageService();

    commandRegistrar.registerAll(context);
    statusBar.register(context);
    changeManager.register(context);

    languageService.initialize(context);
    languageService.registerCompletionProvider(context);
    languageService.registerHoverProvider(context);

    vscode.commands.executeCommand('setContext', 'ollama.enabled', true);

    // Attach to existing terminals for output capture
    terminalService.attachToAllExistingTerminals();

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
