import * as vscode from 'vscode';

export class ChatCommands {
    // This class should not have DOM operations as it runs in Node.js
    // Move any DOM operations to webview code instead
    
    public static registerCommands(context: vscode.ExtensionContext) {
        // Register VS Code commands here
        const sendMessageCommand = vscode.commands.registerCommand('ollama.chat.sendMessage', async () => {
            // Implementation
        });
        
        context.subscriptions.push(sendMessageCommand);
    }
}