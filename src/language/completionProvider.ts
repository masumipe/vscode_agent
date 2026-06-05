import * as vscode from 'vscode';
import { OllamaService } from '../services/ollamaService';
import { ConfigService } from '../services/configService';
import { Logger } from '../telemetry/logger';

export class CompletionProvider implements vscode.CompletionItemProvider {
    private ollamaService: OllamaService;
    private configService = ConfigService.getInstance();
    private logger = Logger.getInstance();

    constructor(ollamaService: OllamaService) {
        this.ollamaService = ollamaService;
    }

    async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken,
        _context: vscode.CompletionContext,
    ): Promise<vscode.CompletionItem[]> {
        const items: vscode.CompletionItem[] = [];
        if (!this.configService.enableCompletion) return items;

        const text = document.getText();
        const wordRange = document.getWordRangeAtPosition(position);
        const word = wordRange ? document.getText(wordRange) : '';
        const offset = document.offsetAt(position);

        if (word.length === 0) return items;
        if (word.length > 50) return items; // skip long words

        try {
            const prompt = `Suggest completions for: ${word}\n\nContext:\n${text.substring(Math.max(0, offset - 200), offset)}`;
            const response = await this.ollamaService.generate(prompt);

            if (response) {
                const suggestions = response.split('\n').filter((s: string) => s.trim().length > 0);
                for (const suggestion of suggestions.slice(0, this.configService.completionLimit)) {
                    const item = new vscode.CompletionItem(
                        suggestion.trim(),
                        vscode.CompletionItemKind.Snippet,
                    );
                    item.detail = 'AI Suggestion';
                    item.insertText = new vscode.SnippetString(suggestion.trim());
                    if (wordRange) item.range = wordRange;
                    items.push(item);
                }
            }
        } catch (error) {
            this.logger.debug('Completion error:', error);
        }

        return items;
    }

    resolveCompletionItem(item: vscode.CompletionItem): vscode.CompletionItem {
        item.detail = item.detail || 'AI Generated';
        return item;
    }
}
