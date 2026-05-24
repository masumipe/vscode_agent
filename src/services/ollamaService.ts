import * as vscode from 'vscode';
// Add other imports as needed

export class OllamaService {
    // ... existing code

    // Add the chat method
    public async chat(model: string, messages: Array<{ role: string; content: string }>): Promise<string> {
        const serverUrl = vscode.workspace.getConfiguration('ollama').get('serverUrl', 'http://localhost:11434');
        
        // Add system message if needed
        const fullMessages = [
            { role: 'system', content: 'You are a helpful AI assistant.' },
            ...messages
        ];
        
        const response = await fetch(`${serverUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                messages: fullMessages,
                stream: false
            })
        });
        
        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.message.content;
    }

    // Make sure generate method exists
    public async generate(prompt: string, model: string, serverUrl?: string): Promise<string> {
        const url = serverUrl || vscode.workspace.getConfiguration('ollama').get('serverUrl', 'http://localhost:11434');
        
        const response = await fetch(`${url}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.7,
                    num_predict: 2000
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.response;
    }

    // Add health check method if needed
    public async healthCheck(serverUrl: string): Promise<{ status: number }> {
        try {
            const response = await fetch(`${serverUrl}/api/tags`);
            return { status: response.status };
        } catch (error) {
            return { status: 500 };
        }
    }
    /**
     * Generate chat completion with options
     */
    public async generateChat(
        model: string, 
        messages: Array<{ role: string; content: string }>, 
        options?: { temperature?: number; num_predict?: number }
    ): Promise<{ message?: { content: string }; response: string; usage?: { total_tokens: number } }> {
        const serverUrl = vscode.workspace.getConfiguration('ollama').get('serverUrl', 'http://localhost:11434');
        
        const response = await fetch(`${serverUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                stream: false,
                options: options || {}
            })
        });
        
        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        return {
            message: { content: data.message.content },
            response: data.message.content,
            usage: data.usage
        };
    }
}