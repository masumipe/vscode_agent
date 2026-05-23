import * as vscode from 'vscode';
export declare class OllamaExtension {
    private ollamaService;
    private agentManager;
    private languageService;
    constructor(context: vscode.ExtensionContext);
    activate(context: vscode.ExtensionContext): Promise<void>;
    deactivate(): Promise<void>;
    private registerCommands;
    private registerStatusBarItem;
    private checkOllamaConnection;
}
declare const _default: OllamaExtension;
export default _default;
