import * as vscode from 'vscode';
import { OllamaService } from '../services/ollamaService';
import { AgentManager } from '../agents/agentManager';

export class OllamaChatPanel {
    private panel: vscode.WebviewPanel | undefined;  // Make this optional
    private ollamaService: OllamaService;
    private agentManager: AgentManager;
    private conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    private isGenerating: boolean = false;

    constructor(ollamaService: OllamaService, agentManager: AgentManager) {
        this.ollamaService = ollamaService;
        this.agentManager = agentManager;
    }

    public async createOrCreate(
        panel: vscode.WebviewPanel,
        ollamaService: OllamaService,
        agentManager: AgentManager
    ) {
        this.panel = panel;
        this.ollamaService = ollamaService;
        this.agentManager = agentManager;
        
        panel.onDidDispose(() => this.dispose(), null, panel.subscriptions);
        
        await this.updateWebview();
    }

    public dispose() {
        if (this.panel) {
            this.panel.dispose();
        }
    }

    private async updateWebview() {
        if (!this.panel) return;

        const model = vscode.workspace.getConfiguration('ollama').get('defaultModel', 'llama3.2');
        const serverUrl = vscode.workspace.getConfiguration('ollama').get('serverUrl', 'http://localhost:11434');

        this.panel.webview.html = await this.getHtmlContent(model, serverUrl);
    }

    private async getHtmlContent(model: string, serverUrl: string): Promise<string> {
        return `...`; // Your HTML content here (same as before)
    }

    public async sendChatMessage(message: string) {
        if (this.isGenerating) return;

        try {
            const model = vscode.workspace.getConfiguration('ollama').get('defaultModel', 'llama3.2');
            
            const response = await this.ollamaService.generate(message, model);
            
            if (response) {
                this.conversationHistory.push({ role: 'user', content: message });
                this.conversationHistory.push({ role: 'assistant', content: response });
                vscode.window.showInformationMessage('Chat message sent successfully!');
            }
        } catch (error) {
            // Fix the unknown error type
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Error sending message: ${errorMessage}`);
        }
    }
}