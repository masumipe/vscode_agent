import * as vscode from 'vscode';
export interface CompletionContext {
    language: string;
    position: vscode.Position;
    document: vscode.TextDocument;
    context: vscode.CompletionContext;
}
export declare class OllamaLanguageService {
    private context;
    private completionProvider;
    private hoverProvider;
    constructor(context: vscode.ExtensionContext);
    /**
     * Initialize the language service
     */
    initialize(): Promise<void>;
    /**
     * Provide intelligent completion items based on context
     */
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.CompletionItem[]>;
    /**
     * Get standard completions based on context
     */
    private getStandardCompletions;
    /**
     * Parse AI suggestions from response
     */
    private parseSuggestions;
    /**
     * Get Ollama client
     */
    private getOllamaClient;
    /**
     * Provide hover information
     */
    provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Hover | null>;
}
