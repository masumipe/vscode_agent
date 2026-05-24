import * as vscode from 'vscode';
export declare class OllamaExtension {
    private ollamaService;
    private agentManager;
    private languageService;
    private chatPanel;
    private context;
    constructor(context: vscode.ExtensionContext);
    activate(context: vscode.ExtensionContext): Promise<void>;
    deactivate(): Promise<void>;
    private registerCommands;
    private registerStatusBarItem;
    private checkOllamaConnection;
    /**
     * Open the Copilot-like GUI chat interface
     */
    private openCopilotGui;
    /**
     * Update the chat view with HTML content
     */
    private updateChatView;
    private generateCode;
    private debugCode;
    private explainCode;
    private refactorCode;
    private writeTests;
    private generateDocs;
    private openNewAgentDialog;
}
export declare function activate(context: vscode.ExtensionContext): Promise<void>;
export declare function deactivate(): Promise<void>;
