import * as vscode from 'vscode';

export interface CompletionContext {
    language: string;
    position: vscode.Position;
    document: vscode.TextDocument;
    context: vscode.CompletionContext;
}

export class OllamaLanguageService {
    private context: vscode.ExtensionContext;
    private completionProvider: vscode.CompletionItemProvider;
    private hoverProvider: vscode.HoverProvider;
    private diagnosticProvider: vscode.DiagnosticProvider;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.completionProvider = new vscode.CompletionItemProvider(this);
        this.hoverProvider = new vscode.HoverProvider(this);
        this.diagnosticProvider = new vscode.DiagnosticProvider(this);
    }

    /**
     * Initialize the language service
     */
    public async initialize(): Promise<void> {
        // Register completion provider
        this.context.subscriptions.push(
            vscode.languages.registerCompletionItemProvider(
                ['typescript', 'javascript', 'python', 'java', 'csharp', 'go', 'rust'],
                this.completionProvider
            )
        );

        // Register hover provider
        this.context.subscriptions.push(
            vscode.languages.registerHoverProvider(
                ['typescript', 'javascript', 'python', 'java', 'csharp', 'go', 'rust'],
                this.hoverProvider
            )
        );

        // Register diagnostic provider
        this.context.subscriptions.push(
            vscode.languages.registerDiagnosticProvider(
                ['typescript', 'javascript', 'python', 'java', 'csharp', 'go', 'rust'],
                this.diagnosticProvider,
                {
                    interFileDependencies: true,
                    workspaceFolderDependencies: true
                }
            )
        );

        // Register code actions provider
        this.context.subscriptions.push(
            vscode.languages.registerCodeActionsProvider(
                ['typescript', 'javascript', 'python', 'java', 'csharp', 'go', 'rust'],
                new vscode.CodeActionsProvider(this)
            )
        );

        // Register inlay hints provider
        this.context.subscriptions.push(
            vscode.languages.registerInlayHintProvider(
                ['typescript', 'javascript', 'python'],
                new vscode.InlayHintsProvider(this)
            )
        );

        console.log('Ollama Language Service initialized');
    }

    /**
     * Provide intelligent completion items based on context
     */
    public async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.CompletionItem[]> {
        const items: vscode.CompletionItem[] = [];
        const text = document.getText();
        const wordUntil = document.getWordUntilPosition(position);
        const word = text.substring(wordUntil.start, wordUntil.end);
        const offset = document.offsetAt(position);
        const line = document.lineAt(position);

        // Skip completion if word is not empty
        if (word && word.length > 0) {
            // Get completion suggestions from Ollama
            try {
                const serverUrl = vscode.workspace.getConfiguration('ollama').get('serverUrl', 'http://localhost:11434');
                const model = vscode.workspace.getConfiguration('ollama').get('defaultModel', 'llama3.2');

                // Create completion prompt
                const prompt = `Suggest completions for: ${word}\n\nContext:\n${text.substring(Math.max(0, offset - 200), offset)}`;

                // Get suggestions from Ollama
                const response = await vscode.window.withProgress(
                    {
                        location: vscode.ProgressLocation.Notification,
                        title: 'Generating completions...',
                        cancellable: false
                    },
                    async () => {
                        try {
                            const client = await this.getOllamaClient();
                            const result = await client.post('/api/generate', {
                                model,
                                prompt,
                                stream: false,
                                options: {
                                    temperature: 0.3,
                                    num_predict: 100
                                }
                            });

                            return result.response?.response || '';
                        } catch (error) {
                            console.error('Ollama completion error:', error);
                            return '';
                        }
                    }
                );

                // Parse and create completion items
                if (response) {
                    const suggestions = this.parseSuggestions(response);
                    suggestions.forEach(suggestion => {
                        const item = new vscode.CompletionItem(suggestion.text, vscode.CompletionItemKind.Snippet);
                        item.detail = suggestion.detail || 'AI Suggestion';
                        item.documentation = new vscode.MarkdownString(suggestion.documentation || '');
                        item.insertText = new vscode.SnippetString(suggestion.snippet || suggestion.text);
                        item.range = new vscode.Range(
                            line.line,
                            wordUntil.start,
                            line.line,
                            wordUntil.end
                        );
                        item.command = {
                            command: 'ollama.acceptCompletion',
                            title: 'Accept Completion'
                        };
                        items.push(item);
                    });
                }
            } catch (error) {
                console.error('Error providing completions:', error);
            }
        }

        // Add standard completions
        items.push(...this.getStandardCompletions(word, line.text));

        return items;
    }

    /**
     * Get standard completions based on context
     */
    private getStandardCompletions(word: string, line: string): vscode.CompletionItem[] {
        const items: vscode.CompletionItem[] = [];

        // Common imports
        const imports = [
            { text: 'import React from \'react\';', detail: 'React import' },
            { text: 'import { useState } from \'react\';', detail: 'useState hook' },
            { text: 'import { useEffect } from \'react\';', detail: 'useEffect hook' },
            { text: 'import axios from \'axios\';', detail: 'Axios import' },
            { text: 'import express from \'express\';', detail: 'Express import' },
            { text: 'import { createApp } from \'@/app\';', detail: 'App creation' }
        ];

        // Filter by word prefix
        imports.forEach(imp => {
            if (imp.text.startsWith(word) || imp.text.includes(word)) {
                items.push(new vscode.CompletionItem(imp.text, vscode.CompletionItemKind.Snippet));
            }
        });

        return items;
    }

    /**
     * Parse AI suggestions from response
     */
    private parseSuggestions(response: string): Array<{ text: string; detail?: string; documentation?: string; snippet?: string }> {
        // Simple parser - in production, use proper JSON parsing
        const lines = response.split('\n');
        return lines.map(line => ({
            text: line.trim(),
            snippet: line.trim()
        })).filter(item => item.text.length > 0);
    }

    /**
     * Get Ollama client
     */
    private async getOllamaClient(): Promise<any> {
        const axios = await import('axios');
        const serverUrl = vscode.workspace.getConfiguration('ollama').get('serverUrl', 'http://localhost:11434');
        return axios.create({
            baseURL: serverUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Provide hover information
     */
    public async provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Hover | null> {
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return null;
        }

        const word = document.getText(wordRange);

        // Check for known symbols
        if (word.startsWith('import') || word.startsWith('export')) {
            return new vscode.Hover(`Module: ${word}\n\nUsage: Import this module into your code.`);
        }

        return null;
    }

    /**
     * Provide diagnostics for code issues
     */
    public async provideDiagnostics(
        document: vscode.TextDocument
    ): Promise<vscode.Diagnostic[]> {
        const diagnostics: vscode.Diagnostic[] = [];

        try {
            const text = document.getText();
            const serverUrl = vscode.workspace.getConfiguration('ollama').get('serverUrl', 'http://localhost:11434');
            const model = vscode.workspace.getConfiguration('ollama').get('defaultModel', 'llama3.2');

            // Get code analysis from Ollama
            const response = await this.analyzeCode(text, model);

            // Parse diagnostics from response
            if (response && response.errors) {
                response.errors.forEach(error => {
                    const range = this.parseRange(error.range);
                    if (range) {
                        diagnostics.push(new vscode.Diagnostic(
                            range,
                            error.message,
                            vscode.DiagnosticSeverity.Error
                        ));
                    }
                });
            }
        } catch (error) {
            console.error('Error providing diagnostics:', error);
        }

        return diagnostics;
    }

    /**
     * Analyze code for issues
     */
    private async analyzeCode(code: string, model: string): Promise<any> {
        try {
            const client = await this.getOllamaClient();
            const messages = [
                { role: 'system', content: 'Analyze this code for errors and issues. Return JSON with errors array.' },
                { role: 'user', content: `Code:\n${code.substring(0, 5000)}` } // Limit to first 5000 chars
            ];

            const result = await client.post('/api/chat', {
                model,
                messages,
                stream: false,
                options: {
                    temperature: 0.1,
                    num_predict: 500
                }
            });

            return result.response;
        } catch (error) {
            console.error('Code analysis error:', error);
            return null;
        }
    }

    /**
     * Parse range string to vscode.Range
     */
    private parseRange(rangeStr: string): vscode.Range | null {
        try {
            const [line, col] = rangeStr.split(',').map(Number);
            return new vscode.Range(line - 1, col);
        } catch (error) {
            return null;
        }
    }
}

/**
 * Completion item provider
 */
class CompletionItemProvider {
    private service: OllamaLanguageService;

    constructor(service: OllamaLanguageService) {
        this.service = service;
    }

    public provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.CompletionItem[] | Thenable<vscode.CompletionItem[]> {
        return this.service.provideCompletionItems(document, position, token);
    }

    public resolveCompletionItem(
        item: vscode.CompletionItem,
        token: vscode.CancellationToken
    ): vscode.CompletionItem | Thenable<vscode.CompletionItem> {
        item.detail = item.detail || 'AI Generated';
        return item;
    }
}

/**
 * Hover provider
 */
class HoverProvider {
    private service: OllamaLanguageService;

    constructor(service: OllamaLanguageService) {
        this.service = service;
    }

    public provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.Hover | Thenable<vscode.Hover> | null {
        return this.service.provideHover(document, position, token);
    }
}

/**
 * Diagnostic provider
 */
class DiagnosticProvider {
    private service: OllamaLanguageService;

    constructor(service: OllamaLanguageService) {
        this.service = service;
    }

    public provideDiagnostics(
        document: vscode.TextDocument
    ): vscode.Diagnostic[] | Thenable<vscode.Diagnostic[]> {
        return this.service.provideDiagnostics(document);
    }
}

/**
 * Code actions provider
 */
class CodeActionsProvider {
    private service: OllamaLanguageService;

    constructor(service: OllamaLanguageService) {
        this.service = service;
    }

    public provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Range[],
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): vscode.CodeAction[] | Thenable<vscode.CodeAction[]> {
        const actions: vscode.CodeAction[] = [];

        // AI Fix suggestion
        actions.push(new vscode.CodeAction(
            'AI: Fix issues',
            vscode.CodeActionKind.QuickFix
        ).withEdit(
            document,
            range,
            [
                new vscode.WorkspaceEdit().changes[document.uri][new vscode.Range(0, 0, 0, 0)]
            ]
        ));

        return actions;
    }
}

/**
 * Inlay hints provider
 */
class InlayHintsProvider {
    private service: OllamaLanguageService;

    constructor(service: OllamaLanguageService) {
        this.service = service;
    }

    public provideInlayHints(
        document: vscode.TextDocument,
        range: vscode.Range,
        token: vscode.CancellationToken
    ): vscode.InlayHint[] | Thenable<vscode.InlayHint[]> {
        return [];
    }
}
