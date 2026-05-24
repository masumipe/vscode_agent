"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaChatPanel = void 0;
const vscode = __importStar(require("vscode"));
class OllamaChatPanel {
    constructor(ollamaService, agentManager) {
        this.conversationHistory = [];
        this.isGenerating = false;
        this.chatInput = document.getElementById('chatInput');
        this.chatHistory = document.getElementById('chatHistory');
        this.ollamaService = ollamaService;
        this.agentManager = agentManager;
    }
    async createOrCreate(panel, ollamaService, agentManager) {
        this.panel = panel;
        this.ollamaService = ollamaService;
        this.agentManager = agentManager;
        // Fix: Remove the third argument - subscriptions is not a property
        panel.onDidDispose(() => this.dispose(), null);
        await this.updateWebview();
    }
    dispose() {
        if (this.panel) {
            this.panel.dispose();
        }
    }
    async updateWebview() {
        if (!this.panel)
            return;
        const model = vscode.workspace.getConfiguration('ollama').get('defaultModel', 'llama3.2');
        const serverUrl = vscode.workspace.getConfiguration('ollama').get('serverUrl', 'http://localhost:11434');
        this.panel.webview.html = await this.getHtmlContent(model, serverUrl);
    }
    async getHtmlContent(model, serverUrl) {
        // Load HTML from file system
        const fs = require('fs');
        const path = require('path');
        const htmlPath = path.join(__dirname, '..', 'gui', 'chat.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
        // Replace placeholders in the HTML
        let modifiedHtml = htmlContent
            .replace(/<title>Ollama AI Assistant<\/title>/g, `<title>Ollama Agent Chat</title>`)
            .replace(/id="chatHistory"/g, `id="chatContainer"`)
            .replace(/id="chatInput"/g, `id="messageInput"`)
            .replace(/id="sendButton"/g, `id="sendBtn"`)
            .replace(/<h1>Ollama AI Assistant<\/h1>/g, `<h1>🤖 Ollama Agent</h1>`)
            .replace(/<h1>Ollama Agent<\/h1>/g, `<h1>🤖 Ollama Agent</h1>`)
            .replace(/<button id="closeBtn">Close Panel<\/button>/g, `<button id="closeBtn">Close Panel</button>`)
            .replace(/<button id="fileExplorerBtn">📁 Files<\/button>/g, `<button id="fileExplorerBtn">📁 Files</button>`)
            .replace(/<label for="modelSelect">Model:<\/label>/g, `<label for="modelSelect">Model:</label>`)
            .replace(/<select id="modelSelect">/g, `<select id="modelSelect">`)
            .replace(/<option value="llama3.2">llama3.2<\/option>/g, `<option value="llama3.2">llama3.2</option>`)
            .replace(/<option value="llama3.1">llama3.1<\/option>/g, `<option value="llama3.1">llama3.1</option>`)
            .replace(/<option value="mistral">mistral<\/option>/g, `<option value="mistral">mistral</option>`)
            .replace(/<option value="codellama">codellama<\/option>/g, `<option value="codellama">codellama</option>`)
            .replace(/<button id="insertBtn">Insert Code<\/button>/g, `<button id="insertBtn">📝 Insert Code</button>`)
            .replace(/<button id="editBtn">Edit Code<\/button>/g, `<button id="editBtn">✏️ Edit Code</button>`)
            .replace(/<button id="deleteBtn">Delete Code<\/button>/g, `<button id="deleteBtn">🗑️ Delete Code</button>`)
            .replace(/<button id="explainBtn">Explain<\/button>/g, `<button id="explainBtn">💡 Explain</button>`)
            .replace(/<button id="sendButton" disabled>Send<\/button>/g, `<button id="sendBtn" disabled>Send</button>`)
            .replace(/<textarea id="chatInput" placeholder="Ask me anything..."><\/textarea>/g, `<textarea id="messageInput" placeholder="Ask Ollama anything... (Shift+Enter for new line, Enter to send)"></textarea>`)
            .replace(/<button id="sendButton" disabled>Send<\/button>/g, `<button id="sendBtn" disabled>Send</button>`)
            .replace(/<div class="chat-input"><\/div>/g, `<div class="input-container"><textarea id="messageInput" placeholder="Ask Ollama anything... (Shift+Enter for new line, Enter to send)"></textarea><button id="sendBtn" disabled>Send</button></div>`)
            .replace(/<div class="chat-input button:disabled {/g, `<div class="input-container button:disabled {`)
            .replace(/<div class="chat-input button:disabled {/g, `<div class="input-container button:disabled {`)
            .replace(/<div class="chat-input button:disabled {/g, `<div class="input-container button:disabled {`)
            .replace(/<div class="chat-input button:disabled {/g, `<div class="input-container button:disabled {`);
        return modifiedHtml;
    }
}
exports.OllamaChatPanel = OllamaChatPanel;
let isGenerating = false;
async function sendMessage() {
    if (isGenerating)
        return;
    const message = chatInput.value.trim();
    if (!message)
        return;
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
    }
    catch (error) {
        addMessage('ai', 'Error: ' + error.message);
    }
    finally {
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
/script> `;
        return htmlContent;
    }

    public async sendChatMessage(message: string) {
        if (this.isGenerating) return;
        if (!this.panel || !this.panel.webview) return;

        const inputElement = this.panel.webview.webContents.executeScript(
            windowId: this.panel.webview.webContents.webFrameId,
            function: (msg: string) => {
                const messageInput = document.getElementById('messageInput') as HTMLTextAreaElement;
                const sendBtn = document.getElementById('sendBtn') as HTMLButtonElement;
                const modelSelect = document.getElementById('modelSelect') as HTMLSelectElement;
                const chatContainer = document.getElementById('chatContainer') as HTMLDivElement;
                const conversationHistory = [];
                let isGenerating = false;

                const message = messageInput.value.trim();
                if (!message || isGenerating) return;

                const userMessage = { role: 'user', content: message };
                conversationHistory.push(userMessage);

                addMessage('user', message);
                messageInput.value = '';
                messageInput.disabled = true;
                sendBtn.disabled = true;

                const loadingId = addLoading();

                try {
                    const model = modelSelect.value;
                    const serverUrl = 'http://localhost:11434';

                    const response = await window.fetch(`;
$;
{
    serverUrl;
}
/api/chat `, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            model,
                            messages: conversationHistory,
                            stream: false
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`;
HTTP;
error;
status: $;
{
    response.status;
}
`);
                    }

                    const data = await response.json();
                    const assistantMessage = { role: 'assistant', content: data.message.content };
                    conversationHistory.push(assistantMessage);

                    removeLoading(loadingId);
                    addMessage('assistant', data.message.content);

                } catch (error) {
                    removeLoading(loadingId);
                    addMessage('system', `;
Error: $;
{
    error.message;
}
Make;
sure;
Ollama;
server;
is;
running;
at;
$;
{
    serverUrl;
}
`);
                } finally {
                    messageInput.disabled = false;
                    sendBtn.disabled = false;
                    messageInput.focus();
                }
            },
            returnByValue: true
        );
    }

    public async sendChatMessage(message: string) {
        if (this.isGenerating) return;
        if (!this.panel || !this.panel.webview) return;

        const inputElement = this.panel.webview.webContents.executeScript(
            windowId: this.panel.webview.webContents.webFrameId,
            function: (msg: string) => {
                const messageInput = document.getElementById('messageInput') as HTMLTextAreaElement;
                const sendBtn = document.getElementById('sendBtn') as HTMLButtonElement;
                const modelSelect = document.getElementById('modelSelect') as HTMLSelectElement;
                const chatContainer = document.getElementById('chatContainer') as HTMLDivElement;
                const conversationHistory = [];
                let isGenerating = false;

                const message = messageInput.value.trim();
                if (!message || isGenerating) return;

                const userMessage = { role: 'user', content: message };
                conversationHistory.push(userMessage);

                addMessage('user', message);
                messageInput.value = '';
                messageInput.disabled = true;
                sendBtn.disabled = true;

                const loadingId = addLoading();

                try {
                    const model = modelSelect.value;
                    const serverUrl = 'http://localhost:11434';

                    const response = await window.fetch(`;
$;
{
    serverUrl;
}
/api/chat `, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            model,
                            messages: conversationHistory,
                            stream: false
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`;
HTTP;
error;
status: $;
{
    response.status;
}
`);
                    }

                    const data = await response.json();
                    const assistantMessage = { role: 'assistant', content: data.message.content };
                    conversationHistory.push(assistantMessage);

                    removeLoading(loadingId);
                    addMessage('assistant', data.message.content);

                } catch (error) {
                    removeLoading(loadingId);
                    addMessage('system', `;
Error: $;
{
    error.message;
}
Make;
sure;
Ollama;
server;
is;
running;
at;
$;
{
    serverUrl;
}
`);
                } finally {
                    messageInput.disabled = false;
                    sendBtn.disabled = false;
                    messageInput.focus();
                }
            },
            returnByValue: true
        );
    };
//# sourceMappingURL=ollamaChatPanel.js.map