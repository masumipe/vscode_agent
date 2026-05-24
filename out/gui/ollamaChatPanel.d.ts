import * as vscode from 'vscode';
import { OllamaService } from '../services/ollamaService';
import { AgentManager } from '../agents/agentManager';
export declare class OllamaChatPanel {
    private panel;
    private ollamaService;
    private agentManager;
    private conversationHistory;
    private isGenerating;
    constructor(ollamaService: OllamaService, agentManager: AgentManager);
    static createOrCreate(panel: vscode.WebviewPanel, ollamaService: OllamaService, agentManager: AgentManager): Promise<void>;
    dispose(): void;
    private updateWebview;
    private getHtmlContent;
    sendChatMessage(message: string): Promise<void>;
}
