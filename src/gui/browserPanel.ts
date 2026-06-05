import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { BrowserService, BrowserConsoleEntry } from '../services/browserService';
import { Logger } from '../telemetry/logger';

export class BrowserPanel {
    private panel: vscode.WebviewPanel | undefined;
    private extensionPath: string = vscode.extensions.getExtension('yourname.vscode-ollama-agent')?.extensionPath || '';
    private logger = Logger.getInstance();
    private browserService: BrowserService;
    private currentContent = '';
    private currentUrl = '';
    private onDisposeCallback: (() => void) | undefined;

    constructor(browserService: BrowserService) {
        this.browserService = browserService;
    }

    show(url: string): void {
        if (this.panel) {
            this.panel.reveal();
            if (url !== this.currentUrl) {
                this.navigate(url);
            }
            return;
        }

        this.currentUrl = url;
        this.panel = vscode.window.createWebviewPanel(
            'ollamaBrowser',
            'Ollama Browser',
            vscode.ViewColumn.One,
            { enableScripts: true, retainContextWhenHidden: true },
        );

        this.updateHtml();
        this.registerHandlers();
        this.navigate(url);

        this.panel.onDidDispose(() => {
            this.panel = undefined;
            if (this.onDisposeCallback) this.onDisposeCallback();
        });
    }

    onDidDispose(callback: () => void): void {
        this.onDisposeCallback = callback;
    }

    async navigate(url: string): Promise<void> {
        this.currentUrl = url;
        if (this.panel) {
            this.panel.title = `Ollama Browser - ${url}`;
        }
        try {
            const response = await fetch(url);
            const content = await response.text();
            this.currentContent = content;
            this.postMessage({ type: 'pageContent', url, content, title: extractTitle(content) || url });
        } catch (error) {
            this.currentContent = '';
            this.postMessage({ type: 'pageContent', url, content: '', title: url, error: String(error) });
        }
    }

    getCurrentContent(): string {
        return this.currentContent;
    }

    dispose(): void {
        if (this.panel) {
            this.panel.dispose();
            this.panel = undefined;
        }
    }

    private updateHtml(): void {
        if (!this.panel) return;
        let html = '';
        try {
            const htmlPath = path.join(this.getExtensionPath(), 'src', 'gui', 'browser.html');
            html = fs.readFileSync(htmlPath, 'utf8');
        } catch {
            html = this.getFallbackHtml();
        }
        this.panel.webview.html = html;
    }

    private getExtensionPath(): string {
        if (this.extensionPath) return this.extensionPath;
        try {
            const ext = vscode.extensions.getExtension('yourname.vscode-ollama-agent');
            if (ext) this.extensionPath = ext.extensionPath;
        } catch {
            this.extensionPath = __dirname;
        }
        return this.extensionPath;
    }

    private registerHandlers(): void {
        if (!this.panel) return;
        this.panel.webview.onDidReceiveMessage(async (msg: { command: string; url?: string; text?: string; type?: string }) => {
            switch (msg.command) {
                case 'navigate':
                    if (msg.url) await this.navigate(msg.url);
                    break;
                case 'console':
                    if (msg.text && msg.type) {
                        const entry: BrowserConsoleEntry = {
                            type: msg.type as BrowserConsoleEntry['type'],
                            text: msg.text,
                            timestamp: Date.now(),
                        };
                        this.browserService.addConsoleEntry(entry);
                    }
                    break;
                case 'close':
                    this.dispose();
                    break;
            }
        });
    }

    private postMessage(msg: { type: string; url: string; content: string; title: string; error?: string }): void {
        this.panel?.webview.postMessage(msg);
    }

    private getFallbackHtml(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Browser</title></head>
<body><p>Failed to load browser interface.</p></body>
</html>`;
    }
}

function extractTitle(html: string): string | undefined {
    const match = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
    return match ? match[1].trim() : undefined;
}
