import * as vscode from 'vscode';
import { OllamaService } from '../services/ollamaService';
import { CompletionProvider } from './completionProvider';
import { HoverProvider } from './hoverProvider';
import { Logger } from '../telemetry/logger';

const SUPPORTED_LANGUAGES = ['typescript', 'javascript', 'python', 'java', 'csharp', 'go', 'rust'];

export class LanguageService {
    private completionProvider: CompletionProvider | undefined;
    private hoverProvider = new HoverProvider();
    private logger = Logger.getInstance();

    initialize(context: vscode.ExtensionContext): void {
        context.subscriptions.push(
            vscode.languages.registerHoverProvider(SUPPORTED_LANGUAGES, this.hoverProvider),
        );
        this.logger.info('Language service initialized');
    }

    registerCompletionProvider(context: vscode.ExtensionContext): void {
        const ollamaService = new OllamaService();
        this.completionProvider = new CompletionProvider(ollamaService);
        context.subscriptions.push(
            vscode.languages.registerCompletionItemProvider(
                SUPPORTED_LANGUAGES,
                this.completionProvider,
                '.',
                ' ',
            ),
        );
    }

    registerHoverProvider(context: vscode.ExtensionContext): void {
        context.subscriptions.push(
            vscode.languages.registerHoverProvider(SUPPORTED_LANGUAGES, this.hoverProvider),
        );
    }
}
