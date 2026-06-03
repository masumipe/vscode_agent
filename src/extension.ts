import * as vscode from 'vscode';
import { exec } from 'child_process';
import { OllamaService } from './services/ollamaService';
import { AgentManager } from './agents/agentManager';
import { OllamaLanguageService } from './utils/ollamaLanguageService';
import { OllamaChatPanel } from './gui/ollamaChatPanel';

export class OllamaExtension {
    private ollamaService: OllamaService;
    private agentManager: AgentManager;
    private languageService: OllamaLanguageService;
    private chatPanel: OllamaChatPanel | null = null;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.ollamaService = new OllamaService();
        this.agentManager = new AgentManager(this.ollamaService);
        this.languageService = new OllamaLanguageService(context);
    }

    public async activate(context: vscode.ExtensionContext) {
        console.log('Ollama Agent Extension is now active!');

        // Initialize language service for code completion
        await this.languageService.initialize();

        // Initialize chat panel
        this.chatPanel = new OllamaChatPanel(this.ollamaService, this.agentManager);
        
        // Register commands
        this.registerCommands(context);
        
        // Provide custom context to enable all Ollama commands
        this.provideCustomContext();
        
        // Check Ollama server connection
        await this.checkOllamaConnection();
        
        // Register status bar item
        this.registerStatusBarItem(context);
    }

    public async deactivate() {
        console.log('Ollama Agent Extension is now deactivated');
    }

    private registerCommands(context: vscode.ExtensionContext) {
        // Create new agent command
        const createAgentDisposable = vscode.commands.registerCommand(
            'ollama.agent.create',
            async () => {
                const agentName = await vscode.window.showInputBox({
                    prompt: 'Enter agent name',
                    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Ollama AI Assistant</title>
        <style>
            :root {
                --bg: var(--vscode-editor-background);
                --fg: var(--vscode-editor-foreground);
                --muted: rgba(255,255,255,0.6);
                --accent: var(--vscode-button-background, #2d89ef);
                --panel: var(--vscode-sideBar-background, #252526);
                --border: var(--vscode-editorWidget-border, #333333);
                --chip: var(--vscode-badge-background, #007acc);
            }
            html,body { height:100%; }
            body { font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial; margin:0; padding:0; height:100%; display:flex; flex-direction:column; background:var(--bg); color:var(--fg); }
            .header { display:flex; justify-content:space-between; align-items:center; padding:10px 12px; border-bottom:1px solid var(--border); background:var(--panel); }
            .header h1 { margin:0; font-size:14px; color:var(--accent); }
            .toolbar { display:flex; gap:8px; align-items:center; }
            .container { display:flex; flex-direction:column; flex:1; min-height:0; }
            .controls { padding:10px; display:flex; gap:8px; align-items:center; }
            .controls input[type=text] { flex:1; padding:6px 8px; border-radius:4px; border:1px solid var(--border); background:transparent; color:var(--fg); }
            .btn { padding:6px 10px; border-radius:4px; border:1px solid var(--border); background:var(--chip); color:var(--fg); cursor:pointer; }
            .chat-history { flex:1; overflow:auto; padding:12px; display:flex; flex-direction:column; gap:10px; }
            .message { max-width:80%; padding:10px 12px; border-radius:8px; white-space:pre-wrap; word-break:break-word; }
            .message.user { margin-left:auto; background:rgba(0,122,204,0.08); border:1px solid rgba(0,122,204,0.15); }
            .message.ai { margin-right:auto; background:rgba(45,137,239,0.08); border:1px solid rgba(45,137,239,0.12); }
            .code { font-family:Consolas, 'Courier New', monospace; font-size:13px; background:var(--panel); border:1px solid var(--border); padding:10px; border-radius:6px; }
            .input-area { padding:10px; border-top:1px solid var(--border); display:flex; gap:8px; align-items:center; }
            textarea#chat-input { flex:1; padding:8px; min-height:48px; border:1px solid var(--border); border-radius:6px; background:transparent; color:var(--fg); }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>💬 Ollama AI Assistant</h1>
            <div class="toolbar">
                <div style="font-size:12px;color:var(--muted);">Server: <span id="server-url"></span></div>
                <div style="font-size:12px;color:var(--muted);">Model: <span id="model-name"></span></div>
            </div>
        </div>

        <div class="container">
            <div class="controls">
                <input id="file-path" type="text" placeholder="File or folder path (absolute)" />
                <button class="btn" id="read-file">Read</button>
                <button class="btn" id="edit-file">Edit</button>
                <button class="btn" id="write-file">Write</button>
                <button class="btn" id="delete-file">Delete</button>
                <button class="btn" id="list-dir">List</button>
            </div>

            <div class="controls">
                <input id="term-cmd" type="text" placeholder="Terminal command (e.g., npm test)" />
                <button class="btn" id="run-cmd">Run</button>
                <button class="btn" id="send-term">Send to Terminal</button>
            </div>

            <div class="controls">
                <input id="fetch-url" type="text" placeholder="Fetch URL (https://...)" />
                <button class="btn" id="fetch-url-btn">Fetch</button>
            </div>

            <div class="chat-history" id="chat-history">
                <div class="message ai">Hello! I'm your Ollama AI assistant. Use the controls above to read/edit files, run terminal commands, or fetch URLs.</div>
            </div>

            <div class="input-area">
                <textarea id="chat-input" placeholder="Ask me anything about code..." rows="2"></textarea>
                <button class="btn" id="send-btn">Send</button>
            </div>
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            const serverUrl = ${JSON.stringify(serverUrl)};
            const modelName = ${JSON.stringify(model)};
            document.getElementById('server-url').textContent = serverUrl;
            document.getElementById('model-name').textContent = modelName;

            const chatHistory = document.getElementById('chat-history');
            function addMessage(role, text, cls) {
                const d = document.createElement('div');
                d.className = 'message ' + role + (cls ? ' ' + cls : '');
                d.textContent = text;
                chatHistory.appendChild(d);
                chatHistory.scrollTop = chatHistory.scrollHeight;
            }

            // File controls
            document.getElementById('read-file').addEventListener('click', () => {
                const path = document.getElementById('file-path').value.trim();
                if (!path) return addMessage('ai', 'Please provide a path to read.');
                vscode.postMessage({ command: 'readFile', path });
            });

            document.getElementById('edit-file').addEventListener('click', () => {
                const path = document.getElementById('file-path').value.trim();
                if (!path) return addMessage('ai', 'Please provide a path to open.');
                vscode.postMessage({ command: 'openFile', path });
            });

            document.getElementById('write-file').addEventListener('click', async () => {
                const path = document.getElementById('file-path').value.trim();
                if (!path) return addMessage('ai', 'Please provide a path to write.');
                const content = prompt('Enter file content to write:');
                if (content == null) return;
                vscode.postMessage({ command: 'writeFile', path, content });
            });

            document.getElementById('delete-file').addEventListener('click', () => {
                const path = document.getElementById('file-path').value.trim();
                if (!path) return addMessage('ai', 'Please provide a path to delete.');
                if (!confirm('Delete ' + path + ' ?')) return;
                vscode.postMessage({ command: 'deleteFile', path, recursive: true });
            });

            document.getElementById('list-dir').addEventListener('click', () => {
                const path = document.getElementById('file-path').value.trim();
                if (!path) return addMessage('ai', 'Please provide a directory path to list.');
                vscode.postMessage({ command: 'readDir', path });
            });

            // Terminal command
            document.getElementById('run-cmd').addEventListener('click', () => {
                const cmd = document.getElementById('term-cmd').value.trim();
                if (!cmd) return addMessage('ai', 'Please provide a command to run.');
                addMessage('user', '$ ' + cmd);
                vscode.postMessage({ command: 'runCommand', cmd });
            });

            document.getElementById('send-term').addEventListener('click', () => {
                const cmd = document.getElementById('term-cmd').value.trim();
                if (!cmd) return addMessage('ai', 'Please provide a command to send.');
                addMessage('user', 'send> ' + cmd);
                vscode.postMessage({ command: 'sendToTerminal', cmd, show: true });
            });

            // Fetch URL
            document.getElementById('fetch-url-btn').addEventListener('click', () => {
                const url = document.getElementById('fetch-url').value.trim();
                if (!url) return addMessage('ai', 'Please provide a URL to fetch.');
                addMessage('user', 'fetch ' + url);
                vscode.postMessage({ command: 'fetchUrl', url });
            });

            // Chat send
            document.getElementById('send-btn').addEventListener('click', async () => {
                const input = document.getElementById('chat-input');
                const text = input.value.trim();
                if (!text) return;
                input.value = '';
                addMessage('user', text);
                try {
                    const res = await fetch(serverUrl + '/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: modelName, prompt: text, stream: false }) });
                    const data = await res.json();
                    const out = data?.response || JSON.stringify(data) || 'No response';
                    addMessage('ai', out);
                } catch (err) {
                    addMessage('ai', 'Error calling Ollama: ' + (err.message || String(err)));
                }
            });

            // Messages from extension
            window.addEventListener('message', (event) => {
                const msg = event.data;
                switch (msg.type) {
                    case 'readFileResponse':
                        addMessage('ai', 'File: ' + msg.path + '\n\n' + msg.content, 'code');
                        break;
                    case 'writeFileResponse':
                        addMessage('ai', 'Wrote file: ' + msg.path);
                        break;
                    case 'deleteFileResponse':
                        addMessage('ai', 'Deleted: ' + msg.path);
                        break;
                    case 'readDirResponse':
                        addMessage('ai', 'Directory: ' + msg.path + '\n' + JSON.stringify(msg.entries, null, 2), 'code');
                        break;
                    case 'runCommandResponse':
                        addMessage('ai', 'Command output:\n' + (msg.stdout || '') + (msg.stderr ? '\nERROR:\n' + msg.stderr : ''), 'code');
                        break;
                    case 'sendToTerminalResponse':
                        addMessage('ai', 'Sent to terminal: ' + msg.terminal + ' cmd: ' + msg.cmd);
                        break;
                    case 'fetchUrlResponse':
                        if (msg.error) addMessage('ai', 'Fetch error: ' + msg.error);
                        else addMessage('ai', 'Fetched: ' + msg.url + '\n' + (msg.body || '').slice(0, 2000), 'code');
                        break;
                    case 'error':
                        addMessage('ai', 'Extension error: ' + msg.message);
                        break;
                    default:
                        console.log('Unknown message', msg);
                }
            });
        </script>
    </body>
    </html>`;
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

        // Handle messages from the webview (file ops, terminal commands, fetch)
        panel.webview.onDidReceiveMessage(async (msg) => {
            try {
                switch (msg.command) {
                    case 'readFile': {
                        const uri = vscode.Uri.file(msg.path);
                        const bytes = await vscode.workspace.fs.readFile(uri);
                        const content = Buffer.from(bytes).toString('utf8');
                        panel.webview.postMessage({ type: 'readFileResponse', path: msg.path, content });
                        break;
                    }
                    case 'writeFile': {
                        const uri = vscode.Uri.file(msg.path);
                        const data = Buffer.from(msg.content, 'utf8');
                        await vscode.workspace.fs.writeFile(uri, data);
                        panel.webview.postMessage({ type: 'writeFileResponse', path: msg.path, success: true });
                        break;
                    }
                    case 'deleteFile': {
                        const uri = vscode.Uri.file(msg.path);
                        await vscode.workspace.fs.delete(uri, { recursive: msg.recursive || false, useTrash: msg.useTrash || false });
                        panel.webview.postMessage({ type: 'deleteFileResponse', path: msg.path, success: true });
                        break;
                    }
                    case 'readDir': {
                        const uri = vscode.Uri.file(msg.path);
                        const entries = await vscode.workspace.fs.readDirectory(uri);
                        panel.webview.postMessage({ type: 'readDirResponse', path: msg.path, entries });
                        break;
                    }
                    case 'runCommand': {
                        const cwd = msg.cwd || vscode.workspace.rootPath || undefined;
                        exec(msg.cmd, { cwd }, (error, stdout, stderr) => {
                            panel.webview.postMessage({ type: 'runCommandResponse', cmd: msg.cmd, stdout, stderr, error: error ? String(error) : null });
                        });
                        break;
                    }
                    case 'sendToTerminal': {
                        // Create or reuse a named terminal and send text to it
                        const termName = msg.terminalName || 'Ollama Agent Terminal';
                        let terminal = vscode.window.terminals.find(t => t.name === termName);
                        if (!terminal) {
                            terminal = vscode.window.createTerminal({ name: termName });
                        }
                        if (msg.show) terminal.show(true);
                        terminal.sendText(msg.cmd, msg.addNewline === undefined ? true : msg.addNewline);
                        panel.webview.postMessage({ type: 'sendToTerminalResponse', cmd: msg.cmd, terminal: termName, success: true });
                        break;
                    }
                    case 'openFile': {
                        try {
                            const uri = vscode.Uri.file(msg.path);
                            const doc = await vscode.workspace.openTextDocument(uri);
                            await vscode.window.showTextDocument(doc, { preview: false });
                            panel.webview.postMessage({ type: 'openFileResponse', path: msg.path, success: true });
                        } catch (err) {
                            panel.webview.postMessage({ type: 'openFileResponse', path: msg.path, success: false, error: String(err) });
                        }
                        break;
                    }
                    case 'fetchUrl': {
                        try {
                            const res = await fetch(msg.url);
                            const text = await res.text();
                            panel.webview.postMessage({ type: 'fetchUrlResponse', url: msg.url, body: text });
                        } catch (err) {
                            panel.webview.postMessage({ type: 'fetchUrlResponse', url: msg.url, error: String(err) });
                        }
                        break;
                    }
                    default:
                        console.warn('Unknown message from webview', msg);
                }
            } catch (err) {
                panel.webview.postMessage({ type: 'error', message: String(err) });
            }
        });
    }

    /**
     * Provide custom context to enable all Ollama commands
     */
    private provideCustomContext() {
        // Set the custom context 'ollama.enabled' to true
        vscode.commands.executeCommand('setContext', 'ollama.enabled', true);
    }

    // Helper methods (implement these as needed)
    private async generateCode(prompt: string, editor: vscode.TextEditor) {}
    private async debugCode(prompt: string, editor: vscode.TextEditor) {}
    private async explainCode(editor: vscode.TextEditor, range: any) {}
    private async refactorCode(editor: vscode.TextEditor, range: any) {}
    private async writeTests(prompt: string, editor: vscode.TextEditor) {}
    private async generateDocs(editor: vscode.TextEditor, range: any) {}
    private async openNewAgentDialog() {}
}

// Module-level extension instance
let extension: OllamaExtension;

// Export activation function for VS Code
export async function activate(context: vscode.ExtensionContext) {
    extension = new OllamaExtension(context);
    await extension.activate(context);
}

// Export deactivation function for VS Code
export async function deactivate() {
    if (extension) {
        await extension.deactivate();
    }
}