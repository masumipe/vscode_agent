import * as vscode from 'vscode';

const CONFIG_SECTION = 'ollama';

export class ConfigService {
    private static instance: ConfigService;
    private disposables: vscode.Disposable[] = [];
    private changeListeners: Array<() => void> = [];

    static getInstance(): ConfigService {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService();
        }
        return ConfigService.instance;
    }

    private constructor() {
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration(CONFIG_SECTION)) {
                this.changeListeners.forEach(l => l());
            }
        }, null, this.disposables);
    }

    onDidChange(listener: () => void): vscode.Disposable {
        this.changeListeners.push(listener);
        return { dispose: () => { this.changeListeners = this.changeListeners.filter(l => l !== listener); } };
    }

    get serverUrl(): string {
        return this.get<string>('serverUrl', 'http://localhost:11434');
    }

    get defaultModel(): string {
        return this.get<string>('defaultModel', 'llama3.2');
    }

    get enableTracing(): boolean {
        return this.get<boolean>('enableTracing', true);
    }

    get maxTokens(): number {
        return this.get<number>('maxTokens', 4096);
    }

    get enableCompletion(): boolean {
        return this.get<boolean>('enableCompletion', true);
    }

    get completionDelay(): number {
        return this.get<number>('completionDelay', 300);
    }

    get completionLimit(): number {
        return this.get<number>('completionLimit', 10);
    }

    isPermissionEnabled(prefix: string, key: string): boolean {
        return this.get<boolean>(`${prefix}.${key}`, false);
    }

    private get<T>(key: string, defaultValue: T): T {
        return vscode.workspace.getConfiguration(CONFIG_SECTION).get<T>(key, defaultValue);
    }

    dispose(): void {
        this.disposables.forEach(d => d.dispose());
    }
}
