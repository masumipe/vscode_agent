import { BrowserPanel } from '../gui/browserPanel';
import { Logger } from '../telemetry/logger';

export interface BrowserConsoleEntry {
    type: 'log' | 'error' | 'warn' | 'info' | 'uncaught';
    text: string;
    timestamp: number;
}

export interface BrowserCaptureResult {
    url: string;
    title: string;
    content: string;
    console: BrowserConsoleEntry[];
    errors: BrowserConsoleEntry[];
}

export class BrowserService {
    private logger = Logger.getInstance();
    private panel: BrowserPanel | undefined;
    private consoleEntries: BrowserConsoleEntry[] = [];

    constructor() {
        this.consoleEntries = [];
    }

    openBrowser(url: string): void {
        if (!this.panel) {
            this.panel = new BrowserPanel(this);
            this.panel.onDidDispose(() => {
                this.panel = undefined;
            });
        }
        this.panel.show(url);
    }

    async navigate(url: string): Promise<void> {
        this.openBrowser(url);
        this.panel?.navigate(url);
    }

    async navigateAndCapture(url: string): Promise<BrowserCaptureResult> {
        this.consoleEntries = [];
        try {
            const response = await fetch(url);
            const content = await response.text();
            const title = extractTitle(content) || url;
            return {
                url,
                title,
                content,
                console: this.consoleEntries,
                errors: this.consoleEntries.filter(e => e.type === 'error' || e.type === 'uncaught'),
            };
        } catch (error) {
            this.logger.error('Browser fetch error:', error);
            return {
                url,
                title: url,
                content: `Error fetching ${url}: ${error}`,
                console: this.consoleEntries,
                errors: [...this.consoleEntries, {
                    type: 'error', text: String(error), timestamp: Date.now(),
                }],
            };
        }
    }

    async captureConsoleOutput(): Promise<BrowserConsoleEntry[]> {
        return this.consoleEntries;
    }

    async capturePageContent(): Promise<string> {
        if (!this.panel) return '';
        return this.panel.getCurrentContent();
    }

    async captureErrors(): Promise<BrowserConsoleEntry[]> {
        return this.consoleEntries.filter(e => e.type === 'error' || e.type === 'uncaught');
    }

    addConsoleEntry(entry: BrowserConsoleEntry): void {
        this.consoleEntries.push(entry);
    }

    getPanel(): BrowserPanel | undefined {
        return this.panel;
    }

    dispose(): void {
        this.panel?.dispose();
        this.panel = undefined;
        this.consoleEntries = [];
    }
}

function extractTitle(html: string): string | undefined {
    const match = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
    return match ? match[1].trim() : undefined;
}
