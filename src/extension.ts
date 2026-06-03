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

        await this.languageService.initialize();

        this.chatPanel = new OllamaChatPanel(this.ollamaService, this.agentManager);

        this.registerCommands(context);
        this.provideCustomContext();
        await this.checkOllamaConnection();
        this.registerStatusBarItem(context);
        // this.registerProblemProvider(context);
    }

    public async deactivate() {
        console.log('Ollama Agent Extension is now deactivated');
    }

    private registerCommands(context: vscode.ExtensionContext) {
        const chatCommand = vscode.commands.registerCommand('ollama.chat', async () => {
            await this.openCopilotGui();
        });

        context.subscriptions.push(chatCommand);
    }

    private registerStatusBarItem(context: vscode.ExtensionContext) {
        const statusBarItem = vscode.window.createStatusBarItem();
        statusBarItem.text = '$(ai-chat) Ollama Agent';
        statusBarItem.command = 'ollama.agent.status';
        statusBarItem.tooltip = 'Ollama Agent Status';
        context.subscriptions.push(statusBarItem);
    }

    private async checkOllamaConnection() {
        try {
            const serverUrl = vscode.workspace.getConfiguration('ollama').get('serverUrl', 'http://localhost:11434');
            if (!serverUrl || (!serverUrl.startsWith('http://') && !serverUrl.startsWith('https://'))) {
                vscode.window.showErrorMessage(`Invalid Ollama URL: "${serverUrl}".`);
                return;
            }

            const response = await this.ollamaService.healthCheck(serverUrl as string);
            if (response.status === 200) {
                vscode.window.showInformationMessage('Ollama server is connected and ready!');
            } else {
                vscode.window.showErrorMessage('Failed to connect to Ollama server. Please check the server URL.');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Ollama connection error: ${error}`);
        }
    }

    private async openCopilotGui() {
        if (this.chatPanel && this.chatPanel.panel) {
            this.chatPanel.panel.reveal(vscode.ViewColumn.One);
            return;
        }

        const panel = vscode.window.createWebviewPanel('ollamaChatPanel', 'Ollama AI Assistant', vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true
        });

        await this.updateChatView(panel);

        panel.onDidDispose(() => {
            console.log('Chat window disposed');
        });
    }

    private async updateChatView(panel: vscode.WebviewPanel) {
        const serverUrl = vscode.workspace.getConfiguration('ollama').get('serverUrl', 'http://localhost:11434');
        const modelName = vscode.workspace.getConfiguration('ollama').get('defaultModel', 'llama3.2');

        const html = `<!DOCTYPE html>
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
    html, body {
      height: 100%;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      background: var(--bg);
      color: var(--fg);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      border-bottom: 1px solid var(--border);
      background: var(--panel);
    }
    .header h1 {
      margin: 0;
      font-size: 14px;
      color: var(--accent);
    }
    .toolbar {
      display: flex;
      gap: 12px;
      align-items: center;
      font-size: 12px;
      color: var(--muted);
    }
    .btn {
      padding: 6px 10px;
      border-radius: 4px;
      border: 1px solid var(--border);
      background: #0078d4;
      color: white;
      cursor: pointer;
    }
    .btn:hover {
      background: #0069ba;
    }
    .container {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
    }
    .controls {
      display: flex;
      gap: 8px;
      padding: 10px;
      flex-wrap: wrap;
      align-items: center;
    }
    .controls input[type=text] {
      flex: 1;
      min-width: 180px;
      padding: 6px 8px;
      border-radius: 4px;
      border: 1px solid var(--border);
      background: transparent;
      color: var(--fg);
    }
    .btn {
      padding: 6px 10px;
      border-radius: 4px;
      border: 1px solid var(--border);
      background: #0078d4;
      color: white;
      cursor: pointer;
    }
    .btn:hover {
      background: #0069ba;
    }
    .chat-history {
      flex: 1;
      overflow: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .message {
      max-width: 80%;
      padding: 10px 12px;
      border-radius: 8px;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .message.user {
      margin-left: auto;
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      color: var(--fg);
    }
    .message.ai {
      margin-right: auto;
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      color: var(--fg);
    }
    .message.code {
      font-family: Consolas, 'Courier New', monospace;
      background: var(--panel);
      border: 1px solid var(--border);
      padding: 10px;
      border-radius: 6px;
      width: 100%;
      max-width: 100%;
    }
    .input-area {
      padding: 10px;
      border-top: 1px solid var(--border);
      display: flex;
      gap: 8px;
      align-items: center;
    }
    textarea#chat-input {
      flex: 1;
      padding: 8px;
      min-height: 48px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: transparent;
      color: var(--fg);
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>💬 Ollama AI Assistant</h1>
    <div class="toolbar">
      <span>Server: <strong id="server-url"></strong></span>
      <span>Model: <strong id="model-name"></strong></span>
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
    const modelName = ${JSON.stringify(modelName)};
    document.getElementById('server-url').textContent = serverUrl;
    document.getElementById('model-name').textContent = modelName;

    const chatHistory = document.getElementById('chat-history');
    function escapeHtml(text) {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function markdownToHtml(text) {
      const codeBlocks = [];
      const placeholder = '¨¨PREBLOCK¨¨';

      let html = text.replace(/\`\`\`([\\s\\S]*?)\`\`\`/g, function(_, code) {
        codeBlocks.push(code);
        return placeholder + (codeBlocks.length - 1) + placeholder;
      });

      html = escapeHtml(html);
      
      // eslint-disable-next-line no-useless-escape
      html = html.replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '<a href="$2" target="_blank" rel="noreferrer noopener">$1</a>');
      html = html.replace(/###### (.*)/g, '<h6>$1</h6>');
      html = html.replace(/##### (.*)/g, '<h5>$1</h5>');
      html = html.replace(/#### (.*)/g, '<h4>$1</h4>');
      html = html.replace(/### (.*)/g, '<h3>$1</h3>');
      html = html.replace(/## (.*)/g, '<h2>$1</h2>');
      html = html.replace(/# (.*)/g, '<h1>$1</h1>');
      
      // eslint-disable-next-line no-useless-escape
      html = html.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>');
      // eslint-disable-next-line no-useless-escape
      html = html.replace(/\\*(.*?)\\*/g, '<em>$1</em>');
      
      html = html.replace(/\`([^\`\\n]+)\`/g, '<code>$1</code>');
      html = html.replace(/\\n/g, '<br>');
      html = html.replace(new RegExp(placeholder + '(\\\\d+)' + placeholder, 'g'), function(_, idx) {
        const code = codeBlocks[parseInt(idx, 10)];
        return '<pre><code>' + escapeHtml(code) + '</code></pre>';
      });

      return html;
    }

    function addMessage(role, text, cls) {
      const node = document.createElement('div');
      node.className = 'message ' + role + (cls ? ' ' + cls : '');
      if (cls === 'code') {
        node.innerHTML = '<pre><code>' + escapeHtml(text) + '</code></pre>';
      } else {
        node.innerHTML = markdownToHtml(text);
      }
      chatHistory.appendChild(node);
      chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    function sendPanelMessage(command, payload) {
      vscode.postMessage(Object.assign({ command }, payload));
    }

    document.getElementById('read-file').addEventListener('click', () => {
      const path = document.getElementById('file-path').value.trim();
      if (!path) return addMessage('ai', 'Please provide a path to read.');
      sendPanelMessage('readFile', { path });
    });

    document.getElementById('edit-file').addEventListener('click', () => {
      const path = document.getElementById('file-path').value.trim();
      if (!path) return addMessage('ai', 'Please provide a path to open.');
      sendPanelMessage('openFile', { path });
    });

    document.getElementById('write-file').addEventListener('click', async () => {
      const path = document.getElementById('file-path').value.trim();
      if (!path) return addMessage('ai', 'Please provide a path to write.');
      const content = prompt('Enter file content to write:');
      if (content == null) return;
      sendPanelMessage('writeFile', { path, content });
    });

    document.getElementById('delete-file').addEventListener('click', () => {
      const path = document.getElementById('file-path').value.trim();
      if (!path) return addMessage('ai', 'Please provide a path to delete.');
      if (!confirm('Delete ' + path + ' ?')) return;
      sendPanelMessage('deleteFile', { path, recursive: true });
    });

    document.getElementById('list-dir').addEventListener('click', () => {
      const path = document.getElementById('file-path').value.trim();
      if (!path) return addMessage('ai', 'Please provide a directory path to list.');
      sendPanelMessage('readDir', { path });
    });

    document.getElementById('run-cmd').addEventListener('click', () => {
      const cmd = document.getElementById('term-cmd').value.trim();
      if (!cmd) return addMessage('ai', 'Please provide a command to run.');
      addMessage('user', '$ ' + cmd);
      sendPanelMessage('runCommand', { cmd });
    });

    document.getElementById('send-term').addEventListener('click', () => {
      const cmd = document.getElementById('term-cmd').value.trim();
      if (!cmd) return addMessage('ai', 'Please provide a command to send.');
      addMessage('user', 'send> ' + cmd);
      sendPanelMessage('sendToTerminal', { cmd, show: true });
    });

    document.getElementById('fetch-url-btn').addEventListener('click', () => {
      const url = document.getElementById('fetch-url').value.trim();
      if (!url) return addMessage('ai', 'Please provide a URL to fetch.');
      addMessage('user', 'fetch ' + url);
      sendPanelMessage('fetchUrl', { url });
    });

    document.getElementById('send-btn').addEventListener('click', async () => {
      const input = document.getElementById('chat-input');
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      addMessage('user', text);
      try {
        const res = await fetch(serverUrl + '/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: modelName, prompt: text, stream: false })
        });
        const data = await res.json();
        addMessage('ai', data?.response || JSON.stringify(data) || 'No response');
      } catch (error) {
        addMessage('ai', 'Error calling Ollama: ' + (error?.message || String(error)));
      }
    });

    window.addEventListener('message', (event) => {
      const msg = event.data;
      switch (msg.type) {
        case 'readFileResponse':
          addMessage('ai', 'File: ' + msg.path + '\\n\\n' + msg.content, 'code');
          break;
        case 'writeFileResponse':
          addMessage('ai', 'Wrote file: ' + msg.path);
          break;
        case 'deleteFileResponse':
          addMessage('ai', 'Deleted: ' + msg.path);
          break;
        case 'readDirResponse':
          addMessage('ai', 'Directory: ' + msg.path + '\\n' + JSON.stringify(msg.entries, null, 2), 'code');
          break;
        case 'runCommandResponse':
          addMessage('ai', 'Command output:\\n' + (msg.stdout || '') + (msg.stderr ? '\\nERROR:\\n' + msg.stderr : ''), 'code');
          break;
        case 'sendToTerminalResponse':
          addMessage('ai', 'Sent to terminal: ' + msg.terminal + ' cmd: ' + msg.cmd);
          break;
        case 'fetchUrlResponse':
          if (msg.error) addMessage('ai', 'Fetch error: ' + msg.error);
          else addMessage('ai', 'Fetched: ' + msg.url + '\\n' + (msg.body || '').slice(0, 2000), 'code');
          break;
        case 'openFileResponse':
          if (msg.success) addMessage('ai', 'Opened file: ' + msg.path);
          else addMessage('ai', 'Open failed: ' + (msg.error || 'Unknown error'));
          break;
        case 'error':
          addMessage('ai', 'Extension error: ' + msg.message);
          break;
        default:
          console.warn('Unknown message', msg);
      }
    });
  </script>
</body>
</html>`;

        panel.webview.html = html;

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
                    } catch (error) {
                        panel.webview.postMessage({ type: 'openFileResponse', path: msg.path, success: false, error: String(error) });
                    }
                    break;
                }
                case 'fetchUrl': {
                    try {
                        const response = await fetch(msg.url);
                        const text = await response.text();
                        panel.webview.postMessage({ type: 'fetchUrlResponse', url: msg.url, body: text });
                    } catch (error) {
                        panel.webview.postMessage({ type: 'fetchUrlResponse', url: msg.url, error: String(error) });
                    }
                    break;
                }
                default:
                    console.warn('Unknown message from webview', msg);
                }
            } catch (error) {
                panel.webview.postMessage({ type: 'error', message: String(error) });
            }
        });
    }

    private provideCustomContext() {
        vscode.commands.executeCommand('setContext', 'ollama.enabled', true);
    }
}

let extension: OllamaExtension;

export async function activate(context: vscode.ExtensionContext) {
    extension = new OllamaExtension(context);
    await extension.activate(context);
}

export async function deactivate() {
    if (extension) {
        await extension.deactivate();
    }
}