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
        this.ollamaService = ollamaService;
        this.agentManager = agentManager;
    }
    async createOrCreate(panel, ollamaService, agentManager) {
        this.panel = panel;
        this.ollamaService = ollamaService;
        this.agentManager = agentManager;
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
        const fs = require('fs');
        const path = require('path');
        const htmlPath = path.join(__dirname, '..', 'gui', 'chat.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
        // Replace placeholders in the HTML
        let modifiedHtml = htmlContent
            .replace(/<title>Ollama AI Assistant<\/title>/g, '<title>Ollama Agent Chat</title>')
            .replace(/id="chatHistory"/g, 'id="chatContainer"')
            .replace(/id="chatInput"/g, 'id="messageInput"')
            .replace(/id="sendButton"/g, 'id="sendBtn"')
            .replace(/<h1>Ollama AI Assistant<\/h1>/g, '<h1>🤖 Ollama Agent</h1>')
            .replace(/<h1>Ollama Agent<\/h1>/g, '<h1>🤖 Ollama Agent</h1>')
            .replace(/<button id="closeBtn">Close Panel<\/button>/g, '<button id="closeBtn">Close Panel</button>')
            .replace(/<button id="fileExplorerBtn">📁 Files<\/button>/g, '<button id="fileExplorerBtn">📁 Files</button>')
            .replace(/<label for="modelSelect">Model:<\/label>/g, '<label for="modelSelect">Model:</label>')
            .replace(/<select id="modelSelect">/g, '<select id="modelSelect">')
            .replace(/<option value="llama3.2">llama3.2<\/option>/g, '<option value="llama3.2">llama3.2</option>')
            .replace(/<option value="llama3.1">llama3.1<\/option>/g, '<option value="llama3.1">llama3.1</option>')
            .replace(/<option value="mistral">mistral<\/option>/g, '<option value="mistral">mistral</option>')
            .replace(/<option value="codellama">codellama<\/option>/g, '<option value="codellama">codellama</option>')
            .replace(/<button id="insertBtn">Insert Code<\/button>/g, '<button id="insertBtn">📝 Insert Code</button>')
            .replace(/<button id="editBtn">Edit Code<\/button>/g, '<button id="editBtn">✏️ Edit Code</button>')
            .replace(/<button id="deleteBtn">Delete Code<\/button>/g, '<button id="deleteBtn">🗑️ Delete Code</button>')
            .replace(/<button id="explainBtn">Explain<\/button>/g, '<button id="explainBtn">💡 Explain</button>')
            .replace(/<button id="sendButton" disabled>Send<\/button>/g, '<button id="sendBtn" disabled>Send</button>')
            .replace(/<textarea id="chatInput" placeholder="Ask me anything..."><\/textarea>/g, '<textarea id="messageInput" placeholder="Ask Ollama anything... (Shift+Enter for new line, Enter to send)"></textarea>');
        // Add inline script
        const inlineScript = `
        <script>
            const messageInput = document.getElementById('messageInput');
            const sendBtn = document.getElementById('sendBtn');
            const chatContainer = document.getElementById('chatContainer');
            const modelSelect = document.getElementById('modelSelect');
            
            let isGenerating = false;
            
            function addMessage(role, content) {
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message ' + role;
                messageDiv.textContent = content;
                chatContainer.appendChild(messageDiv);
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
            
            function addLoading() {
                const loadingDiv = document.createElement('div');
                loadingDiv.className = 'message system loading';
                loadingDiv.textContent = '🤔 Thinking...';
                loadingDiv.id = 'loading-' + Date.now();
                chatContainer.appendChild(loadingDiv);
                chatContainer.scrollTop = chatContainer.scrollHeight;
                return loadingDiv.id;
            }
            
            function removeLoading(loadingId) {
                const loadingElement = document.getElementById(loadingId);
                if (loadingElement) {
                    loadingElement.remove();
                }
            }
            
            async function sendMessage() {
                if (isGenerating) return;
                
                const message = messageInput.value.trim();
                if (!message) return;
                
                // Add user message to UI
                addMessage('user', message);
                messageInput.value = '';
                
                isGenerating = true;
                sendBtn.disabled = true;
                messageInput.disabled = true;
                
                const loadingId = addLoading();
                
                try {
                    const model = modelSelect.value;
                    const serverUrl = 'http://localhost:11434';
                    
                    const response = await fetch(serverUrl + '/api/chat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            model: model,
                            messages: [{ role: 'user', content: message }],
                            stream: false
                        })
                    });
                    
                    if (!response.ok) {
                        throw new Error('HTTP error! status: ' + response.status);
                    }
                    
                    const data = await response.json();
                    removeLoading(loadingId);
                    addMessage('assistant', data.message.content);
                } catch (error) {
                    removeLoading(loadingId);
                    addMessage('system', 'Error: ' + error.message + '. Make sure Ollama server is running at http://localhost:11434');
                } finally {
                    isGenerating = false;
                    sendBtn.disabled = false;
                    messageInput.disabled = false;
                    messageInput.focus();
                }
            }
            
            sendBtn.addEventListener('click', sendMessage);
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });
            
            // Enable send button when there's text
            messageInput.addEventListener('input', () => {
                sendBtn.disabled = !messageInput.value.trim();
            });
        </script>
        `;
        // Insert the script before the closing body tag
        modifiedHtml = modifiedHtml.replace('</body>', inlineScript + '</body>');
        return modifiedHtml;
    }
    async sendChatMessage(message) {
        if (this.isGenerating)
            return;
        if (!this.panel || !this.panel.webview)
            return;
        // Send message to webview
        this.panel.webview.postMessage({
            command: 'sendMessage',
            message: message
        });
    }
}
exports.OllamaChatPanel = OllamaChatPanel;
//# sourceMappingURL=ollamaChatPanel.js.map