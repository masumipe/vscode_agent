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
    }
    /**
     * Initialize the language service
     */
    async initialize() {
        // Register completion provider
        this.context.subscriptions.push(vscode.languages.registerCompletionItemProvider(['typescript', 'javascript', 'python', 'java', 'csharp', 'go', 'rust'], new OllamaCompletionProvider(this)));
        // Register hover provider
        this.context.subscriptions.push(vscode.languages.registerHoverProvider(['typescript', 'javascript', 'python', 'java', 'csharp', 'go', 'rust'], new OllamaHoverProvider(this)));
        console.log('Ollama Language Service initialized');
    }
    /**
     * Provide intelligent completion items based on context
     */
    async provideCompletionItems(document, position, token) {
        const items = [];
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
                        return result.response?.response || '';
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
                        const line = document.lineAt(position);
                        item.range = new vscode.Range(line.range.start, line.range.end);
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
    /**
     * Provide diagnostics for code issues
     */
    async provideDiagnostics(document) {
        const diagnostics = [];
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
                        diagnostics.push(new vscode.Diagnostic(range, error.message, vscode.DiagnosticSeverity.Error));
                    }
                });
            }
        }
        catch (error) {
            console.error('Error providing diagnostics:', error);
        }
        return diagnostics;
    }
    /**
     * Analyze code for issues
     */
    async analyzeCode(code, model) {
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
        }
        catch (error) {
            console.error('Code analysis error:', error);
            return null;
        }
    }
    /**
     * Parse range string to vscode.Range
     */
    parseRange(rangeStr) {
        try {
            const [line, col] = rangeStr.split(',').map(Number);
            return new vscode.Range(line, col);
        }
        catch (error) {
            return null;
        }
    }
}
exports.OllamaLanguageService = OllamaLanguageService;
/**
 * Completion item provider
 */
class OllamaCompletionProvider {
    constructor(service) {
        this.service = service;
    }
    provideCompletionItems(document, position, token) {
        return this.service.provideCompletionItems(document, position, token);
    }
    resolveCompletionItem(item, token) {
        item.detail = item.detail || 'AI Generated';
        return item;
    }
}
/**
 * Hover provider
 */
class OllamaHoverProvider {
    constructor(service) {
        this.service = service;
    }
    provideHover(document, position, token) {
        return this.service.provideHover(document, position, token);
    }
}
/**
 * Diagnostic provider
 */
class OllamaDiagnosticProvider {
    constructor(service) {
        this.service = service;
    }
    provideDiagnostics(document) {
        return this.service.provideDiagnostics(document);
    }
}
/**
 * Code actions provider
 */
class OllamaCodeActionsProvider {
    constructor(service) {
        this.service = service;
    }
    provideCodeActions(document, range, context, token) {
        const actions = [];
        // AI Fix suggestion
        actions.push(new vscode.CodeAction('AI: Fix issues', vscode.CodeActionKind.QuickFix));
        return actions;
    }
}
/**
 * Inlay hints provider
 */
class OllamaInlayHintsProvider {
    constructor(service) {
        this.service = service;
    }
    provideInlayHints(document, range, token) {
        return [];
    }
}
//# sourceMappingURL=ollamaLanguageService.js.map