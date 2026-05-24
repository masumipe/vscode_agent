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
exports.OllamaLanguageService = void 0;
const vscode = __importStar(require("vscode"));
class OllamaLanguageService {
    constructor(context) {
        this.context = context;
        this.completionProvider = new CompletionItemProviderImpl(this);
        this.hoverProvider = new HoverProviderImpl(this);
    }
    /**
     * Initialize the language service
     */
    async initialize() {
        // Register completion provider
        this.context.subscriptions.push(vscode.languages.registerCompletionItemProvider(['typescript', 'javascript', 'python', 'java', 'csharp', 'go', 'rust'], this.completionProvider));
        // Register hover provider
        this.context.subscriptions.push(vscode.languages.registerHoverProvider(['typescript', 'javascript', 'python', 'java', 'csharp', 'go', 'rust'], this.hoverProvider));
        console.log('Ollama Language Service initialized');
    }
    /**
     * Provide intelligent completion items based on context
     */
    async provideCompletionItems(document, position, token) {
        const items = [];
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
                const response = await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: 'Generating completions...',
                    cancellable: false
                }, async () => {
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
                    }
                    catch (error) {
                        console.error('Ollama completion error:', error);
                        return '';
                    }
                });
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
            }
            catch (error) {
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
    getStandardCompletions(word, line) {
        const items = [];
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
    parseSuggestions(response) {
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
    async getOllamaClient() {
        const axios = await Promise.resolve().then(() => __importStar(require('axios')));
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
    async provideHover(document, position, token) {
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
exports.OllamaLanguageService = OllamaLanguageService;
/**
 * Completion item provider implementation
 */
class CompletionItemProviderImpl {
    constructor(service) {
        this.service = service;
    }
    provideCompletionItems(document, position, token, context) {
        return this.service.provideCompletionItems(document, position, token);
    }
    resolveCompletionItem(item, token) {
        item.detail = item.detail || 'AI Generated';
        return item;
    }
}
/**
 * Hover provider implementation
 */
class HoverProviderImpl {
    constructor(service) {
        this.service = service;
    }
    provideHover(document, position, token) {
        return this.service.provideHover(document, position, token);
    }
}
//# sourceMappingURL=ollamaLanguageService.js.map