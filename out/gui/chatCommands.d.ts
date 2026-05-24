import * as vscode from 'vscode';
export declare class ChatCommands {
    private ollamaService;
    private agentManager;
    private panel;
    constructor();
    static createChatPanel(): vscode.WebviewPanel;
    static addMessage(role: string, content: string): void;
    static parseMarkdown(text: string): string;
    static showErrorMessage(message: string): void;
}
