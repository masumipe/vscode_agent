import * as vscode from 'vscode';

// ... rest of your imports

export class OllamaService {
    // ... existing code

    // Add this method if it doesn't exist
    public async chat(model: string, messages: Array<{ role: string; content: string }>): Promise<string> {
        const serverUrl = vscode.workspace.getConfiguration('ollama').get('serverUrl', 'http://localhost:11434');
        
        const response = await fetch(`${serverUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                stream: false
            })
        });
        
        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.message.content;
    }

    // Make sure your generate method exists
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
                stream: false
            })
        });
        
        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.response;
    }
}