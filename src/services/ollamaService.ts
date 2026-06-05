import { ConfigService } from './configService';
import { ChatMessage, ChatOptions, ChatResponse } from '../types';

export class OllamaService {
    private configService = ConfigService.getInstance();

    getBaseUrl(): string {
        return this.configService.serverUrl;
    }

    getDefaultModel(): string {
        return this.configService.defaultModel;
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

    async healthCheck(): Promise<{ status: number }> {
        const response = await fetch(`${this.getBaseUrl()}/api/tags`);
        return { status: response.status };
    }

    async chat(model: string, messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
        const data = await this.request<{ message: { content: string }; response?: string; usage?: { total_tokens: number } }>('/api/chat', {
            model,
            messages,
            stream: false,
            options: options || {},
        });

        return {
            message: { content: data.message.content },
            response: data.response || data.message.content,
            usage: data.usage,
        };
    }

    async generate(prompt: string, model?: string): Promise<string> {
        const actualModel = model || this.getDefaultModel();

        const data = await this.request<{ response: string }>('/api/generate', {
            model: actualModel,
            prompt,
            stream: false,
            options: { temperature: 0.7, num_predict: 2000 },
        });

        return data.response;
    }
}
