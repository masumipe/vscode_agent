import * as vscode from 'vscode';

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface ChatOptions {
    temperature?: number;
    num_predict?: number;
}

export interface ChatResponse {
    message: { content: string };
    response: string;
    usage?: { total_tokens: number };
}

export class OllamaService {
    public getBaseUrl(): string {
        return vscode.workspace.getConfiguration('ollama').get('serverUrl', 'http://localhost:11434');
    }

    public getDefaultModel(): string {
        return vscode.workspace.getConfiguration('ollama').get('defaultModel', 'llama3.2');
    }

    private async request<T>(path: string, body: unknown): Promise<T> {
        const baseUrl = this.getBaseUrl();
        if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
            throw new Error(`Invalid Ollama URL: "${baseUrl}"`);
        }

        const response = await fetch(`${baseUrl}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
        }

        return response.json() as Promise<T>;
    }

    public async healthCheck(serverUrl: string): Promise<{ status: number }> {
        const response = await fetch(`${serverUrl}/api/tags`);
        return { status: response.status };
    }

    public async chat(model: string, messages: ChatMessage[]): Promise<string> {
        const data = await this.request<{ message: { content: string } }>('/api/chat', {
            model,
            messages: [
                { role: 'system', content: 'You are a helpful AI assistant.' },
                ...messages,
            ],
            stream: false,
        });
        return data.message.content;
    }

    public async generate(prompt: string, model?: string, serverUrl?: string): Promise<string> {
        const url = serverUrl || this.getBaseUrl();
        const actualModel = model || this.getDefaultModel();

        const response = await fetch(`${url}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: actualModel,
                prompt,
                stream: false,
                options: { temperature: 0.7, num_predict: 2000 },
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.response;
    }

    public async generateChat(
        model: string,
        messages: ChatMessage[],
        options?: ChatOptions,
    ): Promise<ChatResponse> {
        const data = await this.request<{ message: { content: string }; usage?: { total_tokens: number } }>('/api/chat', {
            model,
            messages,
            stream: false,
            options: options || {},
        });

        return {
            message: { content: data.message.content },
            response: data.message.content,
            usage: data.usage,
        };
    }
}
