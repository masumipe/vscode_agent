import * as vscode from 'vscode';
import { OllamaService } from './services/ollamaService';
import { AgentManager } from './agents/agentManager';
import { OllamaLanguageService } from './utils/ollamaLanguageService';
import { OllamaChatPanel } from './gui/ollamaChatPanel';

export class OllamaExtension {
    ollamaService;
    agentManager;
    languageService;
    chatPanel = null;
    context;

    constructor(context) {
        this.context = context;
        this.ollamaService = new OllamaService();
        this.agentManager = new AgentManager(this.ollamaService);
        this.languageService = new OllamaLanguageService(context);
    }

    async activate(context) {
        console.log('Ollama Agent Extension is now active!');

        // Initialize language service for code completion
        await this.languageService.initialize();

        // Initialize chat panel
        this.chatPanel = new OllamaChatPanel(this.ollamaService, this.agentManager);
        
        // Register commands
        this.registerCommands(context);
        
        // Check Ollama server connection
        await this.checkOllamaConnection();
        
        // Register status bar item
        this.registerStatusBarItem(context);
    }

    async deactivate() {
        console.log('Ollama Agent Extension is now deactivated');
    }

    async registerCommands(context) {
        // Create new agent command
        const createAgentDisposable = vscode.commands.registerCommand(
            'ollama.agent.create',
            async () => {
                const agentName = await vscode.window.showInputBox({
                    prompt: 'Enter agent name',
                    placeHolder: 'e.g., Research Assistant'
                });

                if (agentName) {
                    await this.agentManager.createAgent(agentName);
                    vscode.window.showInformationMessage(`Agent "${agentName}" created successfully!`);
                }
            }
        );

        // Run agent command
        const runAgentDisposable = vscode.commands.registerCommand(
            'ollama.agent.run',
            async () => {
                const agentName = await vscode.window.showInputBox({
                    prompt: 'Enter agent name to run',
                    placeHolder: 'e.g., Research Assistant'
                });

                if (agentName) {
                    await this.agentManager.runAgent(agentName, 'What would you like the agent to do?');
                }
            }
        );

        // Evaluate agent command
        const evaluateAgentDisposable = vscode.commands.registerCommand(
            'ollama.agent.evaluate',
            async () => {
                const agentName = await vscode.window.showInputBox({
                    prompt: 'Enter agent name to evaluate',
                    placeHolder: 'e.g., Research Assistant'
                });

                if (agentName) {
                    await this.agentManager.evaluateAgent(agentName, 'How would you like to evaluate this agent?');
                }
            }
        );

        // Debug agent command
        const debugAgentDisposable = vscode.commands.registerCommand(
            'ollama.agent.debug',
            async () => {
                const agentName = await vscode.window.showInputBox({
                    prompt: 'Enter agent name to debug',
                    placeHolder: 'e.g., Research Assistant'
                });

                if (agentName) {
                    await this.agentManager.debugAgent(agentName, 'What would you like to debug?');
                }
            }
        );

        // Copilot-like GUI commands
        const chatCommand = vscode.commands.registerCommand(
            'ollama.chat',
            async () => {
                await this.openCopilotGui();
            }
        );

        const openPanelCommand = vscode.commands.registerCommand(
            'ollama.chat.openPanel',
            async () => {
                // Implementation
            }
        );

        const sendCommand = vscode.commands.registerCommand(
            'ollama.chat.send',
            async () => {
                // Implementation
            }
        );

        const closePanelCommand = vscode.commands.registerCommand(
            'ollama.chat.closePanel',
            async () => {
                // Implementation
            }
        );

        const generateCodeCommand = vscode.commands.registerCommand(
            'ollama.generateCode',
            async () => {
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    const prompt = await vscode.window.showInputBox({
                        prompt: 'What code would you like to generate?',
                        placeHolder: 'e.g., "Create a React component with state management"'
                    });

                    if (prompt) {
                        await this.generateCode(prompt, editor);
                    }
                }
            }
        );

        const debugCodeCommand = vscode.commands.registerCommand(
            'ollama.debugCode',
            async () => {
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    const prompt = await vscode.window.showInputBox({
                        prompt: 'What would you like to debug?',
                        placeHolder: 'e.g., "This function is slow, how can I optimize it?"'
                    });

                    if (prompt) {
                        await this.debugCode(prompt, editor);
                    }
                }
            }
        );

        const explainCodeCommand = vscode.commands.registerCommand(
            'ollama.explainCode',
            async () => {
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    const range = await vscode.window.showQuickPick([
                        { label: 'Current line', description: 'Explain the current line of code' },
                        { label: 'Selected code', description: 'Explain the selected code' },
                        { label: 'Function/method', description: 'Explain the entire function or method' },
                        { label: 'File', description: 'Explain the entire file' }
                    ], { placeHolder: 'Select code to explain' });

                    if (range) {
                        await this.explainCode(editor, range);
                    }
                }
            }
        );

        const refactorCommand = vscode.commands.registerCommand(
            'ollama.refactor',
            async () => {
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    const range = await vscode.window.showQuickPick([
                        { label: 'Current line', description: 'Refactor the current line' },
                        { label: 'Selected code', description: 'Refactor the selected code' },
                        { label: 'Function/method', description: 'Refactor the entire function or method' },
                        { label: 'File', description: 'Refactor the entire file' }
                    ], { placeHolder: 'Select code to refactor' });

                    if (range) {
                        await this.refactorCode(editor, range);
                    }
                }
            }
        );

        const writeTestsCommand = vscode.commands.registerCommand(
            'ollama.writeTests',
            async () => {
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    const prompt = await vscode.window.showInputBox({
                        prompt: 'What tests would you like to write?',
                        placeHolder: 'e.g., "Write unit tests for this function"'
                    });

                    if (prompt) {
                        await this.writeTests(prompt, editor);
                    }
                }
            }
        );

        const generateDocsCommand = vscode.commands.registerCommand(
            'ollama.generateDocs',
            async () => {
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    const range = await vscode.window.showQuickPick([
                        { label: 'Current line', description: 'Generate documentation for the current line' },
                        { label: 'Selected code', description: 'Generate documentation for the selected code' },
                        { label: 'Function/method', description: 'Generate documentation for the entire function or method' },
                        { label: 'File', description: 'Generate documentation for the entire file' }
                    ], { placeHolder: 'Select code to document' });

                    if (range) {
                        await this.generateDocs(editor, range);
                    }
                }
            }
        );

        const newAgentCommand = vscode.commands.registerCommand(
            'ollama.newAgent',
            async () => {
                await this.openNewAgentDialog();
            }
        );

        context.subscriptions.push(
            createAgentDisposable,
            runAgentDisposable,
            evaluateAgentDisposable,
            debugAgentDisposable,
            chatCommand,
            openPanelCommand,
            sendCommand,
            closePanelCommand,
            generateCodeCommand,
            debugCodeCommand,
            explainCodeCommand,
            refactorCommand,
            writeTestsCommand,
            generateDocsCommand,
            newAgentCommand
        );
    }

    async registerStatusBarItem(context) {
        const statusBarItem = vscode.window.createStatusBarItem();
        statusBarItem.text = '$(ai-chat) Ollama Agent';
        statusBarItem.command = 'ollama.agent.status';
        statusBarItem.tooltip = 'Ollama Agent Status';
        
        context.subscriptions.push(statusBarItem);
    }

    async checkOllamaConnection() {
        try {
            const serverUrl = vscode.workspace.getConfiguration('ollama').get('serverUrl', 'http://localhost:11434');
            
            // Validate URL format before attempting connection
            if (!serverUrl || !serverUrl.startsWith('http://') && !serverUrl.startsWith('https://')) {
                vscode.window.showErrorMessage(
                    `Invalid Ollama URL: "${serverUrl}". ` +
                    `Please update your VS Code settings to use a valid URL format (e.g., http://localhost:11434)`
                );
                return;
            }
            
            const response = await this.ollamaService.healthCheck(serverUrl);
            
            if (response.status === 200) {
                vscode.window.showInformationMessage('Ollama server is connected and ready!');
            } else {
                vscode.window.showErrorMessage('Failed to connect to Ollama server. Please check the server URL.');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Ollama connection error: ${error}`);
        }
    }

    /**
     * Open the Copilot-like GUI chat interface
     */
    async openCopilotGui() {
        const chatWindow = vscode.window.createWebviewPanel(
            'ollama-chat',
            'Ollama AI Assistant',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        // Set webview content
        await this.updateChatView(chatWindow);

        chatWindow.onDidDispose(() => {
            console.log('Chat window disposed');
        });
    }

    /**
     * Update the chat view with HTML content
     */
    async updateChatView(panel) {
        const webview = panel.webview;
        const serverUrl = vscode.workspace.getConfiguration('ollama').get('serverUrl', 'http://localhost:11434');
        const model = vscode.workspace.getConfiguration('ollama').get('defaultModel', 'llama3.2');

        const htmlContent = `
<!DOCTYPE html>
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
            border-bottom-left-radius: 0;
        }
        .message.user {
            background-color: #007acc;
            align-self: flex-end;
            border-bottom-right-radius: 0;
        }
        .message.code {
            background-color: #1e1e1e;
            border: 1px solid #3c3c3c;
            align-self: center;
            max-width: 100%;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 14px;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .input-container {
            padding: 20px;
            border-top: 1px solid #3c3c3c;
            background-color: #1e1e1e;
        }
        .input-wrapper {
            display: flex;
            gap: 10px;
        }
        #chat-input {
            flex: 1;
            padding: 12px 16px;
            border: 1px solid #3c3c3c;
            border-radius: 6px;
            background-color: #2d2d2d;
            color: #d4d4d4;
            font-size: 14px;
            resize: none;
            outline: none;
        }
        #chat-input:focus {
            border-color: #2d89ef;
        }
        .send-btn {
            padding: 10px 20px;
            background-color: #2d89ef;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.2s;
        }
        .send-btn:hover {
            background-color: #1e6fd9;
        }
        .send-btn:disabled {
            background-color: #3c3c3c;
            cursor: not-allowed;
        }
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 2px solid #ffffff;
            border-radius: 50%;
            border-top-color: transparent;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .code-block {
            background-color: #2d2d2d;
            padding: 15px;
            border-radius: 6px;
            overflow-x: auto;
            margin: 10px 0;
        }
        .code-block pre {
            margin: 0;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 14px;
        }
        .code-block code {
            white-space: pre;
        }
        .actions {
            display: flex;
            gap: 10px;
            margin-top: 10px;
            flex-wrap: wrap;
        }
        .action-btn {
            padding: 6px 12px;
            background-color: #3c3c3c;
            color: #d4d4d4;
            border: 1px solid #4c4c4c;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
        }
        .action-btn:hover {
            background-color: #2d89ef;
            border-color: #2d89ef;
        }
        .action-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .header {
            padding: 10px 20px;
            background-color: #1e1e1e;
            border-bottom: 1px solid #3c3c3c;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .header h1 {
            font-size: 18px;
            color: #2d89ef;
        }
        .settings {
            display: flex;
            gap: 15px;
            font-size: 12px;
        }
        .setting-item {
            color: #888;
        }
        .setting-item span {
            color: #d4d4d4;
        }
        .scroll-area {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
        }
        .scroll-area::-webkit-scrollbar {
            width: 8px;
        }
        .scroll-area::-webkit-scrollbar-track {
            background: #1e1e1e;
        }
        .scroll-area::-webkit-scrollbar-thumb {
            background: #3c3c3c;
            border-radius: 4px;
        }
        .scroll-area::-webkit-scrollbar-thumb:hover {
            background: #4c4c4c;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>💬 Ollama AI Assistant</h1>
        <div class="settings">
            <div class="setting-item">Server: <span id="server-url"></span></div>
            <div class="setting-item">Model: <span id="model-name"></span></div>
        </div>
    </div>
    <div class="chat-container">
        <div class="chat-history" id="chat-history">
            <div class="message ai">
                Hello! I'm your Ollama AI assistant. I can help you with:<br><br>
                • <b>Generate code</b> - Ask me to write functions, classes, or entire features<br>
                • <b>Explain code</b> - Select code and ask me to explain it<br>
                • <b>Debug issues</b> - Share bugs and I'll help you find the problem<br>
                • <b>Refactor code</b> - Improve your code quality and readability<br>
                • <b>Write tests</b> - Generate unit and integration tests<br>
                • <b>Generate documentation</b> - Create docstrings and comments<br><br>
                Try it out by typing a message below!
            </div>
        </div>
        <div class="input-container">
            <div class="input-wrapper">
                <textarea 
                    id="chat-input" 
                    placeholder="Ask me anything about code... (e.g., 'Create a React component with state management')"
                    rows="3"
                ></textarea>
                <button class="send-btn" id="send-btn">Send</button>
            </div>
        </div>
    </div>
    <script>
        const sendBtn = document.getElementById('send-btn');
        const chatInput = document.getElementById('chat-input');
        const chatHistory = document.getElementById('chat-history');
        const serverUrlElement = document.getElementById('server-url');
        const modelNameElement = document.getElementById('model-name');
        
        // Get configuration
        const serverUrl = ${JSON.stringify(serverUrl)};
        const modelName = ${JSON.stringify(model)};
        
        serverUrlElement.textContent = serverUrl;
        modelNameElement.textContent = modelName;
        
        async function sendMessage() {
            const message = chatInput.value.trim();
            if (!message) return;
            
            chatInput.value = '';
            chatInput.disabled = true;
            sendBtn.disabled = true;
            
            addMessage('user', message);
            showLoading();
            
            try {
                const response = await fetch(serverUrl + '/api/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: modelName,
                        prompt: message,
                        stream: false,
                        options: {
                            temperature: 0.3,
                            num_predict: 2000
                        }
                    })
                });
                
                const data = await response.json();
                const result = data?.response || 'No response received.';
                
                removeLoading();
                addMessage('ai', result);
            } catch (error) {
                removeLoading();
                addMessage('ai', 'Error: ' + error.message + '. Make sure Ollama is running and the server URL is correct.');
            } finally {
                chatInput.disabled = false;
                sendBtn.disabled = false;
                chatInput.focus();
            }
        }
        
        function addMessage(role, content) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ' + role;
            messageDiv.textContent = content;
            chatHistory.appendChild(messageDiv);
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }
        
        function showLoading() {
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'message ai';
            loadingDiv.id = 'loading-message';
            loadingDiv.innerHTML = '<div class="loading"></div>';
            chatHistory.appendChild(loadingDiv);
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }
        
        function removeLoading() {
            const loadingDiv = document.getElementById('loading-message');
            if (loadingDiv) {
                loadingDiv.remove();
            }
        }
        
        sendBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    </script>
</body>
</html>`;

        panel.webview.html = htmlContent;
    }

    // Helper methods (implement these as needed)
    async generateCode(prompt, editor) {}
    async debugCode(prompt, editor) {}
    async explainCode(editor, range) {}
    async refactorCode(editor, range) {}
    async writeTests(prompt, editor) {}
    async generateDocs(editor, range) {}
    async openNewAgentDialog() {}
}

// Module-level extension instance
let extension;

// Export activation function for VS Code
export async function activate(context) {
    extension = new OllamaExtension(context);
    await extension.activate(context);
}

// Export deactivation function for VS Code
export async function deactivate() {
    if (extension) {
        await extension.deactivate();
    }
}