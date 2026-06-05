import * as vscode from 'vscode';
import { ConfigService } from '../services/configService';
import { Commands } from '../types/commands';

export class StatusBarManager {
    private item: vscode.StatusBarItem;
    private configService = ConfigService.getInstance();

    constructor() {
        this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.item.text = '$(ai-chat) Ollama Agent';
        this.item.command = Commands.AgentStatus;
        this.item.tooltip = 'Ollama Agent Status - Click for details';
    }

    register(context: vscode.ExtensionContext): void {
        context.subscriptions.push(this.item);
        this.update();
    }

    update(): void {
        this.item.text = '$(ai-chat) Ollama Agent';
    }

    dispose(): void {
        this.item.dispose();
    }
}
