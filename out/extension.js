"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaExtension = void 0;
const vscode = __importStar(require("vscode"));
const ollamaService_1 = require("./services/ollamaService");
const agentManager_1 = require("./agents/agentManager");
const ollamaLanguageService_1 = require("./utils/ollamaLanguageService");
class OllamaExtension {
    constructor(context) {
        this.ollamaService = new ollamaService_1.OllamaService();
        this.agentManager = new agentManager_1.AgentManager(this.ollamaService);
        this.languageService = new ollamaLanguageService_1.OllamaLanguageService(context);
    }
    async activate(context) {
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
    async deactivate() {
        console.log('Ollama Agent Extension is now deactivated');
    }
    registerCommands(context) {
        // Create new agent command
        const createAgentDisposable = vscode.commands.registerCommand('ollama.agent.create', async () => {
            const agentName = await vscode.window.showInputBox({
                prompt: 'Enter agent name',
                placeHolder: 'e.g., Research Assistant'
            });
            if (agentName) {
                await this.agentManager.createAgent(agentName);
                vscode.window.showInformationMessage(`Agent "${agentName}" created successfully!`);
            }
        });
        // Run agent command
        const runAgentDisposable = vscode.commands.registerCommand('ollama.agent.run', async () => {
            const agentName = await vscode.window.showInputBox({
                prompt: 'Enter agent name to run',
                placeHolder: 'e.g., Research Assistant'
            });
            if (agentName) {
                await this.agentManager.runAgent(agentName, 'What would you like the agent to do?');
            }
        });
        // Evaluate agent command
        const evaluateAgentDisposable = vscode.commands.registerCommand('ollama.agent.evaluate', async () => {
            const agentName = await vscode.window.showInputBox({
                prompt: 'Enter agent name to evaluate',
                placeHolder: 'e.g., Research Assistant'
            });
            if (agentName) {
                await this.agentManager.evaluateAgent(agentName, 'How would you like to evaluate this agent?');
            }
        });
        // Debug agent command
        const debugAgentDisposable = vscode.commands.registerCommand('ollama.agent.debug', async () => {
            const agentName = await vscode.window.showInputBox({
                prompt: 'Enter agent name to debug',
                placeHolder: 'e.g., Research Assistant'
            });
            if (agentName) {
                await this.agentManager.debugAgent(agentName, 'What would you like to debug?');
            }
        });
        // Accept completion command
        const acceptCompletionDisposable = vscode.commands.registerCommand('ollama.acceptCompletion', async () => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const selection = editor.selection;
                if (selection.isEmpty) {
                    await vscode.commands.executeCommand('editor.action.inlineSuggest.accept');
                }
            }
        });
        context.subscriptions.push(createAgentDisposable, runAgentDisposable, evaluateAgentDisposable, debugAgentDisposable, acceptCompletionDisposable);
    }
    async registerStatusBarItem(context) {
        const statusBarItem = vscode.window.createStatusBarItem();
        statusBarItem.text = '$(ai-chat) Ollama Agent';
        statusBarItem.command = 'ollama.agent.status';
        statusBarItem.tooltip = 'Ollama Agent Status';
        context.subscriptions.push(statusBarItem);
    }
    async checkOllamaConnection() {
        try {
            const serverUrl = vscode.workspace.getConfiguration('ollama').get('serverUrl', 'http://localhost:11434');
            const response = await this.ollamaService.healthCheck(serverUrl);
            if (response.status === 200) {
                vscode.window.showInformationMessage('Ollama server is connected and ready!');
            }
            else {
                vscode.window.showErrorMessage('Failed to connect to Ollama server. Please check the server URL.');
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Ollama connection error: ${error}`);
        }
    }
}
exports.OllamaExtension = OllamaExtension;
// Export the extension class
exports.default = new OllamaExtension(context);
//# sourceMappingURL=extension.js.map