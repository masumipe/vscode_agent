import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { OllamaService } from '../services/ollamaService';
import { AgentManager } from '../agents/agentManager';
import { WebviewRequest, WebviewResponse } from '../types/messages';
import { Logger } from '../telemetry/logger';

export class ChatPanel {
    private panel: vscode.WebviewPanel | undefined;
    private ollamaService: OllamaService;
    private agentManager: AgentManager;
    private extensionPath: string;
    private logger = Logger.getInstance();

    constructor(ollamaService: OllamaService, agentManager: AgentManager, context: vscode.ExtensionContext) {
        this.ollamaService = ollamaService;
        this.agentManager = agentManager;
        this.extensionPath = context.extensionPath;
    }

    show(column: vscode.ViewColumn = vscode.ViewColumn.One): void {
        if (this.panel) {
            this.panel.reveal(column);
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'ollamaChatPanel',
            'Ollama AI Assistant',
            column,
            { enableScripts: true, retainContextWhenHidden: true },
        );

        this.updateWebview();
        this.registerMessageHandlers();
        this.panel.onDidDispose(() => { this.panel = undefined; });
    }

    dispose(): void {
        if (this.panel) {
            this.panel.dispose();
            this.panel = undefined;
        }
    }

    private async updateWebview(): Promise<void> {
        if (!this.panel) return;

        const serverUrl = this.ollamaService.getBaseUrl();
        const defaultModel = this.ollamaService.getDefaultModel();

        let htmlContent: string;
        try {
            const htmlPath = path.join(this.extensionPath, 'src', 'gui', 'chat.html');
            htmlContent = fs.readFileSync(htmlPath, 'utf-8');
        } catch {
            htmlContent = this.getFallbackHtml();
        }

        const script = `
        <script>
            const vscode = acquireVsCodeApi();
            const initialState = {
                serverUrl: ${JSON.stringify(serverUrl)},
                defaultModel: ${JSON.stringify(defaultModel)}
            };
            vscode.setState(initialState);
        </script>`;

        htmlContent = htmlContent.replace('</head>', script + '</head>');
        this.panel.webview.html = htmlContent;
    }

    private registerMessageHandlers(): void {
        if (!this.panel) return;

        this.panel.webview.onDidReceiveMessage(async (msg: WebviewRequest) => {
            try {
                switch (msg.command) {
                    case 'generate':
                    case 'sendMessage':
                        await this.handleGenerate(msg);
                        break;
                    case 'readFile':
                        await this.handleReadFile(msg);
                        break;
                    case 'writeFile':
                        await this.handleWriteFile(msg);
                        break;
                    case 'deleteFile':
                        await this.handleDeleteFile(msg);
                        break;
                    case 'readDir':
                        await this.handleReadDir(msg);
                        break;
                    case 'runCommand':
                        await this.handleRunCommand(msg);
                        break;
                    case 'sendToTerminal':
                        await this.handleSendToTerminal(msg);
                        break;
                    case 'openFile':
                        await this.handleOpenFile(msg);
                        break;
                    case 'fetchUrl':
                        await this.handleFetchUrl(msg);
                        break;
                    case 'closePanel':
                        this.dispose();
                        break;
                    default:
                        this.logger.warn('Unknown webview message:', msg.command);
                }
            } catch (error) {
                this.postMessage({ type: 'error', message: String(error) });
            }
        });
    }

    private async handleGenerate(msg: WebviewRequest): Promise<void> {
        const model = msg.model || this.ollamaService.getDefaultModel();
        const baseUrl = this.ollamaService.getBaseUrl();
        this.postMessage({ type: 'config', serverUrl: baseUrl, defaultModel: model });

        const response = await fetch(`${baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                messages: msg.messages || [{ role: 'user', content: msg.text || msg.message }],
                stream: false,
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        this.postMessage({
            type: 'result',
            text: data.message?.content || data.response || 'No response',
        });
    }

    private async handleReadFile(msg: WebviewRequest): Promise<void> {
        const uri = vscode.Uri.file(msg.path!);
        const bytes = await vscode.workspace.fs.readFile(uri);
        const content = Buffer.from(bytes).toString('utf8');
        this.postMessage({ type: 'readFileResponse', path: msg.path, content });
    }

    private async handleWriteFile(msg: WebviewRequest): Promise<void> {
        const uri = vscode.Uri.file(msg.path!);
        const data = Buffer.from(msg.content!, 'utf8');
        await vscode.workspace.fs.writeFile(uri, data);
        this.postMessage({ type: 'writeFileResponse', path: msg.path, success: true });
    }

    private async handleDeleteFile(msg: WebviewRequest): Promise<void> {
        const uri = vscode.Uri.file(msg.path!);
        await vscode.workspace.fs.delete(uri, {
            recursive: msg.recursive || false,
            useTrash: msg.useTrash || false,
        });
        this.postMessage({ type: 'deleteFileResponse', path: msg.path, success: true });
    }

    private async handleReadDir(msg: WebviewRequest): Promise<void> {
        const uri = vscode.Uri.file(msg.path!);
        const entries = await vscode.workspace.fs.readDirectory(uri);
        this.postMessage({ type: 'readDirResponse', path: msg.path, entries });
    }

    private async handleRunCommand(msg: WebviewRequest): Promise<void> {
        const cwd = msg.cwd || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        exec(msg.cmd!, { cwd }, (error, stdout, stderr) => {
            this.postMessage({
                type: 'runCommandResponse',
                cmd: msg.cmd,
                stdout,
                stderr,
                error: error ? String(error) : null,
            });
        });
    }

    private async handleSendToTerminal(msg: WebviewRequest): Promise<void> {
        const termName = msg.terminalName || 'Ollama Agent Terminal';
        let terminal = vscode.window.terminals.find(t => t.name === termName);
        if (!terminal) {
            terminal = vscode.window.createTerminal({ name: termName });
        }
        if (msg.show !== false) terminal.show(true);
        terminal.sendText(msg.cmd!, true);
        this.postMessage({ type: 'sendToTerminalResponse', cmd: msg.cmd, terminal: termName, success: true });
    }

    private async handleOpenFile(msg: WebviewRequest): Promise<void> {
        try {
            const uri = vscode.Uri.file(msg.path!);
            const doc = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(doc, { preview: false });
            this.postMessage({ type: 'openFileResponse', path: msg.path, success: true });
        } catch (error) {
            this.postMessage({ type: 'openFileResponse', path: msg.path, success: false, error: String(error) });
        }
    }

    private async handleFetchUrl(msg: WebviewRequest): Promise<void> {
        try {
            const response = await fetch(msg.url!);
            const text = await response.text();
            this.postMessage({ type: 'fetchUrlResponse', url: msg.url, body: text });
        } catch (error) {
            this.postMessage({ type: 'fetchUrlResponse', url: msg.url, error: String(error) });
        }
    }

    private postMessage(message: WebviewResponse): void {
        this.panel?.webview.postMessage(message);
    }

    async sendUserMessage(): Promise<void> {
        if (!this.panel) return;
        try {
            const message = await vscode.window.showInputBox({
                title: 'Send Message',
                placeHolder: 'Type your message here...',
            });
            if (message && message.trim()) {
                const baseUrl = this.ollamaService.getBaseUrl();
                const model = this.ollamaService.getDefaultModel();
                await fetch(`${baseUrl}/api/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model,
                        messages: [{ role: 'user', content: message.trim() }],
                        stream: false,
                    }),
                });
                vscode.window.showInformationMessage('Message sent successfully!');
            }
        } catch (error) {
            this.logger.error('Error sending user message:', error);
            vscode.window.showErrorMessage(`Failed to send message: ${error}`);
        }
    }

    private getFallbackHtml(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ollama Agent</title>
</head>
<body>
    <p>Failed to load chat interface.</p>
</body>
</html>`;
    }
}
