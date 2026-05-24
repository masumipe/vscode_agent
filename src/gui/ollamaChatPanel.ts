import * as vscode from 'vscode';
import { OllamaService } from '../services/ollamaService';
import { AgentManager } from '../agents/agentManager';

export class OllamaChatPanel {
    public panel: vscode.WebviewPanel | undefined;
    private ollamaService: OllamaService;
    private agentManager: AgentManager;
    private conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    private isGenerating: boolean = false;

    constructor(ollamaService: OllamaService, agentManager: AgentManager) {
        this.ollamaService = ollamaService;
        this.agentManager = agentManager;
    }

    public async createOrCreate(
        panel: vscode.WebviewPanel,
        ollamaService: OllamaService,
        agentManager: AgentManager
    ) {
        this.panel = panel;
        this.ollamaService = ollamaService;
        this.agentManager = agentManager;
        
        // Fix: Remove the third argument - subscriptions is not a property
        panel.onDidDispose(() => this.dispose(), null);
        
        await this.updateWebview();
    }

    public dispose() {
        if (this.panel) {
            this.panel.dispose();
        }
    }

    private async updateWebview() {
        if (!this.panel) return;

        const model = vscode.workspace.getConfiguration('ollama').get('defaultModel', 'llama3.2');
        const serverUrl = vscode.workspace.getConfiguration('ollama').get('serverUrl', 'http://localhost:11434');

        this.panel.webview.html = await this.getHtmlContent(model, serverUrl);
    }

    private async getHtmlContent(model: string, serverUrl: string): Promise<string> {
        // Your HTML content here
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ollama AI Assistant</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
            background-color: #1e1e1e;
            color: #d4d4d4;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .chat-container {
            flex: 1;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        .chat-history {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .message {
            max-width: 80%;
            padding: 12px 16px;
            border-radius: 8px;
            line-height: 1.5;
            animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .message.ai {
            background-color: #2d89ef;
            align-self: flex-start;
        }
        .message.user {
            background-color: #1e1e1e;
            align-self: flex-end;
        }
        .chat-input {
            padding: 20px;
            border-top: 1px solid #3e3e3e;
        }
        .chat-input textarea {
            width: 100%;
            padding: 12px;
            border: 1px solid #3e3e3e;
            border-radius: 8px;
            background-color: #2d2d2d;
            color: #d4d4d4;
            font-family: inherit;
            font-size: 14px;
            resize: none;
            height: 60px;
        }
        .chat-input textarea:focus {
            outline: none;
            border-color: #2d89ef;
        }
        .chat-input button {
            margin-top: 10px;
            padding: 10px 20px;
            background-color: #2d89ef;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
        }
        .chat-input button:hover {
            background-color: #1e6fe1;
        }
        .chat-input button:disabled {
            background-color: #3e3e3e;
            cursor: not-allowed;
        }
    </style>
</head>
<body>
    <div class="chat-container">
        <div class="chat-history" id="chatHistory"></div>
        <div class="chat-input">
            <textarea id="chatInput" placeholder="Ask me anything..."></textarea>
            <button id="sendButton" disabled>Send</button>
        </div>
    </div>
    <script>
        const sendButton = document.getElementById('sendButton');
        const chatInput = document.getElementById('chatInput');
        const chatHistory = document.getElementById('chatHistory');
        
        let isGenerating = false;
        
        async function sendMessage() {
            if (isGenerating) return;
            
            const message = chatInput.value.trim();
            if (!message) return;
            
            // Add user message to UI
            addMessage('user', message);
            chatInput.value = '';
            
            isGenerating = true;
            sendButton.disabled = true;
            
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'vaultbox/qwen3.5-uncensored:4b',
                        messages: [{ role: 'user', content: message }],
                        stream: false
                    })
                });
                
                const data = await response.json();
                
                // Add AI response to UI
                addMessage('ai', data.message.content);
            } catch (error) {
                addMessage('ai', 'Error: ' + error.message);
            } finally {
                isGenerating = false;
                sendButton.disabled = false;
            }
        }
        
        function addMessage(role, content) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ' + role;
            messageDiv.textContent = content;
            chatHistory.appendChild(messageDiv);
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }
        
        sendButton.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    </script>
`;
        return htmlContent;
    }

    public async sendChatMessage(message: string) {
        if (this.isGenerating) return;

        try {
            const model = vscode.workspace.getConfiguration('ollama').get('defaultModel', 'llama3.2');
            
            // Use chat method instead of generate
            const response = await this.ollamaService.chat(model, [
                { role: 'user', content: message }
            ]);
            
            if (response) {
                this.conversationHistory.push({ role: 'user', content: message });
                this.conversationHistory.push({ role: 'assistant', content: response });
                vscode.window.showInformationMessage('Chat message sent successfully!');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Error sending message: ${errorMessage}`);
        }
    }
}