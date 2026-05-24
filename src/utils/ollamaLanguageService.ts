import * as vscode from 'vscode';

export interface CompletionContext {
    language: string;
    position: vscode.Position;
    document: vscode.TextDocument;
    context: vscode.CompletionContext;
}

export class OllamaLanguageService {
    private context: vscode.ExtensionContext;
    private completionProvider: CompletionItemProviderImpl;
    private hoverProvider: HoverProviderImpl;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.completionProvider = new CompletionItemProviderImpl(this);
        this.hoverProvider = new HoverProviderImpl(this);
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
        const wordRange = document.getWordRangeAtPosition(position);
        const word = wordRange ? document.getText(wordRange) : '';
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

                            return result.data?.response || '';
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
                        if (wordRange) {
                            item.range = wordRange;
                        }
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
        return axios.default.create({
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
}

/**
 * Completion item provider implementation
 */
class CompletionItemProviderImpl implements vscode.CompletionItemProvider {
    private service: OllamaLanguageService;

    constructor(service: OllamaLanguageService) {
        this.service = service;
    }

    public provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
        return this.service.provideCompletionItems(document, position, token);
    }

    public resolveCompletionItem(
        item: vscode.CompletionItem,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.CompletionItem> {
        item.detail = item.detail || 'AI Generated';
        return item;
    }
}

/**
 * Hover provider implementation
 */
class HoverProviderImpl implements vscode.HoverProvider {
    private service: OllamaLanguageService;

    constructor(service: OllamaLanguageService) {
        this.service = service;
    }

    public provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {
        return this.service.provideHover(document, position, token);
    }
}
