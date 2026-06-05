# Ollama Agent Extension

## Overview

Independent AI agenting extension for VS Code Insiders — works like GitHub Copilot with local Ollama models. No external API calls, no data leaves your machine.

- AI-powered code completion (inline suggestions)
- Copilot-style agent that reads, writes, runs, debugs, and tests code
- Chat panel with file/terminal/web operations
- Autonomous agent with granular permission control

## Prerequisites

- Node.js v18+
- VS Code (or Insiders)
- Ollama installed and running locally

## Quick Start

```powershell
npm install
npm run compile
```

1. Start Ollama: `ollama serve`
2. In VS Code, press `F5` to launch the Extension Development Host
3. Open Command Palette (`Ctrl+Shift+P`) and run **Ollama: Open AI Assistant**

## All Commands

### Chat

| Command | Title | Description |
|---------|-------|-------------|
| `ollama.chat` | Ollama: Open AI Assistant | Open the AI chat panel |
| `ollama.chat.send` | Ollama: Send Message | Trigger chat input |
| `ollama.chat.closePanel` | Ollama: Close Chat Panel | Close the chat panel |

### Agents

| Command | Title | Description |
|---------|-------|-------------|
| `ollama.newAgent` | Ollama: New Agent | Create a new agent interactively |
| `ollama.agent.create` | Ollama: Create New Agent | Create agent from explorer context |
| `ollama.agent.run` | Ollama: Run Agent | Run an agent with a prompt |
| `ollama.agent.evaluate` | Ollama: Evaluate Agent | Evaluate agent output |
| `ollama.agent.debug` | Ollama: Debug Agent | Debug agent behavior |
| `ollama.agent.status` | Ollama: Toggle Status | Show agent/server status |

### Code Actions

These operate on the active editor selection (or entire file if nothing selected):

| Command | Title | Description |
|---------|-------|-------------|
| `ollama.generateCode` | Ollama: Generate Code | Generate code from context |
| `ollama.debugCode` | Ollama: Debug Code | Debug selected code |
| `ollama.explainCode` | Ollama: Explain Code | Explain selected code |
| `ollama.refactor` | Ollama: Refactor Code | Refactor selected code |
| `ollama.writeTests` | Ollama: Write Tests | Write tests for selected code |
| `ollama.generateDocs` | Ollama: Generate Documentation | Generate docs for selected code |

### AI Agent (Copilot-style)

| Command | Title | Description |
|---------|-------|-------------|
| `ollama.copilot.ask` | AI Agent: Ask Agent | Ask the autonomous agent a question |
| `ollama.copilot.readEditor` | AI Agent: Read Editor | Read active editor content |
| `ollama.copilot.readFile` | AI Agent: Read File | Read a file from disk |
| `ollama.copilot.writeFile` | AI Agent: Write File | Write content to a file |
| `ollama.copilot.deleteFile` | AI Agent: Delete File | Delete a file |
| `ollama.copilot.insertCode` | AI Agent: Insert Code | Insert code at cursor |
| `ollama.copilot.runCode` | AI Agent: Run Code | Execute a shell command |
| `ollama.copilot.testCode` | AI Agent: Test Code | Run tests for a file |
| `ollama.copilot.debugCode` | AI Agent: Debug Code | Start debug session |
| `ollama.copilot.browseWeb` | AI Agent: Browse Web | Open a URL in browser |
| `ollama.copilot.executeCommand` | AI Agent: Execute Command | Run a terminal command |
| `ollama.copilot.status` | AI Agent: Show Status | Show current permissions |

### Completion

| Command | Title |
|---------|-------|
| `ollama.acceptCompletion` | Ollama: Accept Completion |

## Configuration

```jsonc
{
  // Server
  "ollama.serverUrl": "http://localhost:11434",
  "ollama.defaultModel": "llama3.2",

  // Tracing
  "ollama.enableTracing": true,
  "ollama.maxTokens": 4096,

  // Inline completions
  "ollama.enableCompletion": true,
  "ollama.completionDelay": 300,
  "ollama.completionLimit": 10,

  // Autonomous agent permissions (all default false — opt-in)
  "ollama.autonomous.readEditor": false,
  "ollama.autonomous.readTerminal": false,
  "ollama.autonomous.readFolder": false,
  "ollama.autonomous.writeFile": false,
  "ollama.autonomous.deleteFile": false,
  "ollama.autonomous.insertCode": false,
  "ollama.autonomous.runCode": false,
  "ollama.autonomous.testCode": false,
  "ollama.autonomous.debugCode": false,
  "ollama.autonomous.browseWeb": false,
  "ollama.autonomous.executeCommand": false,

  // AI Agent permissions (all default true — like Copilot)
  "ollama.copilot.readEditor": true,
  "ollama.copilot.readTerminal": true,
  "ollama.copilot.readFolder": true,
  "ollama.copilot.writeFile": true,
  "ollama.copilot.deleteFile": true,
  "ollama.copilot.insertCode": true,
  "ollama.copilot.runCode": true,
  "ollama.copilot.testCode": true,
  "ollama.copilot.debugCode": true,
  "ollama.copilot.browseWeb": true,
  "ollama.copilot.executeCommand": true
}
```

## Usage

### Chat panel

Open via **Ollama: Open AI Assistant**. From the chat UI you can:
- Ask natural-language questions
- Read and edit files
- Write/delete files and directories
- List folder contents
- Execute shell commands
- Send commands to a terminal
- Fetch URLs

### Code actions

Select code in the editor, then run any **Code Action** command.
The result opens in a new editor tab beside your current file.

### AI Agent

Run **AI Agent: Ask Agent** to get the autonomous agent's plan for a task. Use the individual `ollama.copilot.*` commands to perform specific operations (read/write files, run/debug code, browse web, etc.).

## Project Layout

```
src/
├── extension.ts              # Entry point
├── activation/
│   ├── activate.ts           # Dependency wiring
│   ├── commandRegistrar.ts   # All command registrations
│   └── statusBarManager.ts   # Status bar UI
├── agents/
│   ├── agentManager.ts       # Agent lifecycle
│   ├── autonomousAgent.ts    # Full autonomous agent
│   ├── copilotAgent.ts       # Copilot-style agent
│   └── permissions.ts        # Permission system
├── gui/
│   ├── chat.html             # Webview UI
│   └── chatPanel.ts          # Chat panel controller
├── language/
│   ├── completionProvider.ts # Inline completions
│   ├── hoverProvider.ts      # Hover info
│   └── languageService.ts    # Language feature orchestrator
├── services/
│   ├── configService.ts      # Centralized config access
│   └── ollamaService.ts      # Ollama API client
├── storage/
│   ├── agentStore.ts         # Agent persistence
│   └── traceStore.ts         # Trace persistence
├── telemetry/
│   └── logger.ts             # Structured logging
└── types/
    ├── commands.ts           # Command constants
    ├── index.ts              # Shared interfaces
    └── messages.ts           # Webview message types
```

## Troubleshooting

- **Panel won't open**: Run `Ollama: Open AI Assistant` from the command palette
- **Ollama connection error**: Verify `ollama serve` is running on port 11434
- **No completions**: Check `ollama.enableCompletion` is `true` and model is pulled (`ollama pull llama3.2`)
- **Permission denied**: Enable the corresponding `ollama.autonomous.*` or `ollama.copilot.*` setting

## Supported Languages

TypeScript, JavaScript, Python, Java, C#, Go, Rust (and any language your Ollama model supports).

## License

ISC
