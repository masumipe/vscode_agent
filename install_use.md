I'll provide you with comprehensive instructions on how to install and use the Ollama Agent Extension.



\## \*\*Installation Methods\*\*



\### \*\*Method 1: Install from VSIX File (Recommended)\*\*



1\. \*\*Locate the VSIX file:\*\*

&#x20;  - The extension is already packaged as `vscode-ollama-agent-0.0.1.vsix` in vscode-ollama-agent-extension



2\. \*\*Install via Command Palette:\*\*

&#x20;  ```

&#x20;  - Press Ctrl+Shift+P

&#x20;  - Type: "Install Extension"

&#x20;  - Browse to and select: `d:\\Myfiles\\vscode-ollama-agent-extension\\vscode-ollama-agent-0.0.1.vsix`

&#x20;  ```



3\. \*\*Or drag and drop:\*\*

&#x20;  - Drag the `.vsix` file into VS Code window



\### \*\*Method 2: Install from Source Code\*\*



1\. \*\*Open VS Code Command Palette:\*\*

&#x20;  ```

&#x20;  - Press Ctrl+Shift+P

&#x20;  ```



2\. \*\*Run the install command:\*\*

&#x20;  ```

&#x20;  - Type: "Extension: Install from VSIX..."

&#x20;  - Browse to: `d:\\Myfiles\\vscode-ollama-agent-extension\\vscode-ollama-agent-0.0.1.vsix`

&#x20;  ```



\### \*\*Method 3: Development Mode (For Testing)\*\*



1\. \*\*Open VS Code Command Palette:\*\*

&#x20;  ```

&#x20;  - Press Ctrl+Shift+P

&#x20;  ```



2\. \*\*Run development mode:\*\*

&#x20;  ```

&#x20;  - Type: "Developer: Reload Window"

&#x20;  - Or use: `code-insiders --extensionDevelopmentPath=D:\\Myfiles\\vscode-ollama-agent-extension`

&#x20;  ```



\---



\## \*\*Configuration\*\*



\### \*\*VS Code Settings\*\*



The extension is already configured with these settings in settings.json:



```json

{

&#x20; "ollama.serverUrl": "http://localhost:11434",

&#x20; "ollama.defaultModel": "vaultbox/qwen3.5-uncensored:4b",

&#x20; "ollama.enableTracing": true,

&#x20; "ollama.maxTokens": 4096,

&#x20; "ollama.enableCompletion": true,

&#x20; "ollama.completionDelay": 300,

&#x20; "ollama.completionLimit": 10

}

```



\### \*\*Verify Configuration:\*\*



1\. \*\*Open Command Palette:\*\* `Ctrl+Shift+P`

2\. \*\*Type:\*\* `Ollama: Chat`

3\. \*\*Expected Result:\*\*

&#x20;  - Webview panel appears in \*\*left sidebar\*\*

&#x20;  - Panel displays "Ollama AI Assistant"

&#x20;  - Chat interface loads with HTML content

&#x20;  - Connected to Ollama server at `http://localhost:11434`



\---



\## \*\*Using the Extension\*\*



\### \*\*1. Open the Chat Interface\*\*



\*\*Method A: Command Palette\*\*

```

\- Press Ctrl+Shift+P

\- Type: "Ollama: Chat" or "ollama.chat"

```



\*\*Method B: Status Bar\*\*

\- Look for `$(ai-chat) Ollama Agent` in the bottom status bar

\- Click on it to open the chat panel



\### \*\*2. Chat with the AI Assistant\*\*



1\. \*\*The chat panel opens in the left sidebar\*\*

2\. \*\*Type your message\*\* in the input field

3\. \*\*Press Enter\*\* or click "Send"

4\. \*\*Receive AI response\*\* from Ollama



\*\*Example:\*\*

```

User: What is the capital of France?

AI: The capital of France is Paris.

```



\### \*\*3. Create and Manage Agents\*\*



\*\*Create a New Agent:\*\*

```

\- Press Ctrl+Shift+P

\- Type: "Ollama: Create New Agent"

\- Enter agent name (e.g., "Research Assistant")

\- Agent is created successfully

```



\*\*Run an Agent:\*\*

```

\- Press Ctrl+Shift+P

\- Type: "Ollama: Run Agent"

\- Enter agent name

\- Provide instructions for the agent

```



\*\*Evaluate/Debug an Agent:\*\*

```

\- Press Ctrl+Shift+P

\- Type: "Ollama: Evaluate Agent" or "Ollama: Debug Agent"

\- Enter agent name

\- Provide evaluation/debugging instructions

```



\### \*\*4. AI-Powered Code Assistance\*\*



\*\*Generate Code:\*\*

```

\- Press Ctrl+Shift+P

\- Type: "Ollama: Generate Code"

\- Describe what code you want to generate

```



\*\*Debug Code:\*\*

```

\- Press Ctrl+Shift+P

\- Type: "Ollama: Debug Code"

\- Describe the issue you want to debug

```



\*\*Explain Code:\*\*

```

\- Press Ctrl+Shift+P

\- Type: "Ollama: Explain Code"

\- Select code to explain (current line, selected code, function, or file)

```



\*\*Refactor Code:\*\*

```

\- Press Ctrl+Shift+P

\- Type: "Ollama: Refactor"

\- Select code to refactor

```



\*\*Write Tests:\*\*

```

\- Press Ctrl+Shift+P

\- Type: "Ollama: Write Tests"

\- Describe what tests to write

```



\*\*Generate Documentation:\*\*

```

\- Press Ctrl+Shift+P

\- Type: "Ollama: Generate Documentation"

\- Select code to document

```



\---



\## \*\*Troubleshooting\*\*



\### \*\*Issue: Extension not showing all commands\*\*



\*\*Solution:\*\*

1\. \*\*Check VS Code settings:\*\*

&#x20;  - Open settings.json

&#x20;  - Ensure `ollama.chat.enableViewColumnPicker` is set to `true`

&#x20;  - Ensure `ollama.chat.enableSidePanelPicker` is set to `true`



2\. \*\*Restart VS Code:\*\*

&#x20;  ```

&#x20;  - Close VS Code completely

&#x20;  - Reopen VS Code

&#x20;  ```



\### \*\*Issue: Toggle Status shows error\*\*



\*\*Solution:\*\*

1\. \*\*Verify Ollama server is running:\*\*

&#x20;  ```powershell

&#x20;  # Check if Ollama is running

&#x20;  curl http://localhost:11434/api/tags

&#x20;  ```



2\. \*\*Check Ollama server URL:\*\*

&#x20;  - Ensure it's set to `http://localhost:11434` in VS Code settings



3\. \*\*Restart Ollama server:\*\*

&#x20;  ```powershell

&#x20;  # Start Ollama

&#x20;  ollama serve

&#x20;  ```



\### \*\*Issue: Chat panel doesn't appear\*\*



\*\*Solution:\*\*

1\. \*\*Check view column settings:\*\*

&#x20;  - Open Command Palette: `Ctrl+Shift+P`

&#x20;  - Type: `Ollama: Chat`

&#x20;  - Panel should appear in left sidebar (ViewColumn.One)



2\. \*\*Verify webview permissions:\*\*

&#x20;  - Go to VS Code Settings

&#x20;  - Search for "Webview"

&#x20;  - Ensure "Allow to run scripts" is enabled



\---



\## \*\*Quick Start Commands\*\*



| Command | Description |

|---------|-------------|

| `ollama.chat` | Open AI Assistant chat panel |

| `ollama.agent.create` | Create a new agent |

| `ollama.agent.run` | Run an existing agent |

| `ollama.agent.evaluate` | Evaluate an agent |

| `ollama.agent.debug` | Debug an agent |

| `ollama.agent.status` | Toggle agent status |

| `ollama.generateCode` | Generate code with AI |

| `ollama.debugCode` | Debug code with AI |

| `ollama.explainCode` | Explain code with AI |

| `ollama.refactor` | Refactor code with AI |

| `ollama.writeTests` | Write tests with AI |

| `ollama.generateDocs` | Generate documentation with AI |



\---



\## \*\*Test the Extension\*\*



Run the comprehensive test suite:



```powershell

cd d:\\Myfiles\\FinRpt\\news\_search\_app

.venv\\Scripts\\activate.ps1

python test\_all.py

```



This will test all 12 functionality areas and verify the extension is working correctly.



\---



\*\*Your Ollama Agent Extension is ready to use! 🚀\*\*

