import * as vscode from 'vscode';

export class HoverProvider implements vscode.HoverProvider {
    provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken,
    ): vscode.ProviderResult<vscode.Hover> {
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) return null;

        const word = document.getText(wordRange);

        if (word.startsWith('import') || word.startsWith('export')) {
            return new vscode.Hover(`Module: ${word}\n\nUsage: Import this module into your code.`);
        }

        return null;
    }
}
