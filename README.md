# Ollama Agent Extension

## Overview

This extension integrates VS Code with a local Ollama server to provide:
- AI-powered code completion
- Agent-based coding assistance
- Copilot-style chat panel for file and terminal operations
- Local development support with no external data sharing

## Prerequisites

Make sure you have the following installed:
- Node.js v18 or later
- npm v8 or later
- Visual Studio Code
- Ollama installed and running locally

## Installation

1. Open a terminal in the extension folder:

```powershell
cd d:\Myfiles\vscode-ollama-agent-extension
```

2. Install dependencies:

```powershell
npm install
```

3. Compile the extension:

```powershell
npm run compile
```

## Getting Started

1. Start the Ollama server if it is not already running:

```powershell
ollama serve
```

2. Launch the extension development host from VS Code with `F5`.
3. In the new window, open the command palette with `Ctrl+Shift+P`.
4. Run `Ollama: Open AI Assistant`.
5. Use the chat panel to read files, edit content, run commands, and fetch URLs.

## Running the Extension

### From source in VS Code

1. Open this folder in VS Code.
2. Press `F5` to launch the Extension Development Host.
3. In the new window, open the command palette with `Ctrl+Shift+P`.
4. Run `Ollama: Open AI Assistant`.

### From a packaged VSIX

1. Build the extension package:

```powershell
npm run compile
npx vsce package
```

2. Install the generated `.vsix` file via `Extensions: Install from VSIX`.

## Configuration

Use your workspace or user settings to configure Ollama:

```json
{
  "ollama.serverUrl": "http://localhost:11434",
  "ollama.defaultModel": "llama3.2",
  "ollama.enableCompletion": true,
  "ollama.maxTokens": 4096
}
```

## Usage

### Open the AI assistant

- Run `Ollama: Open AI Assistant` from the command palette.
- This opens the same chat panel used for all interactive Ollama features.
- `Ollama: Open Chat Panel` was previously a duplicate alias and has been removed to avoid redundancy.

### Chat panel features

From the chat UI, you can:
- read and edit files
- write file content
- delete files and directories
- list folder contents
- execute shell commands
- send text into a terminal
- fetch data from URLs
- ask natural language AI questions

Messages now support Markdown formatting in the chat window, including headings, bold/italic text, inline code, fenced code blocks, and links.

### Example commands

- `ollama.chat` — open the chat assistant
- `ollama.agent.create` — create a new AI agent
- `ollama.agent.run` — run an agent with a prompt
- `ollama.agent.evaluate` — evaluate agent output
- `ollama.agent.debug` — debug agent behavior

## Developer Workflow

### Build and watch

```powershell
npm run compile
npm run watch
```

### Run tests

```powershell
npm test
```

## Project layout

```
vscode-ollama-agent-extension/
├── src/
│   ├── extension.ts
│   ├── services/
│   ├── agents/
│   ├── gui/
│   └── utils/
├── tests/
├── package.json
├── tsconfig.json
└── README.md
```

## Notes

- The chat interface and the assistant command now use the same panel implementation.
- There is no separate redundant "open chat panel" command in current active code.
- Keep Ollama running at `http://localhost:11434` before opening the assistant.

# F1 -> "Ollama: Create New Agent"
# Enter: "Code Review Assistant"
```

### Running Code Generation

```powershell
# Create a function that generates code
# F1 -> "Ollama: Run Agent"
# Enter: "Generate a React component with state management"
```

## Next Steps

1. Review the source code in `src/` directory
2. Customize agent configurations
3. Add new features and capabilities
4. Write unit tests in `tests/` directory
5. Package and publish to VS Code Marketplace

## Troubleshooting

### Extension doesn't load

- Check VS Code output panel for errors
- Ensure TypeScript compilation succeeded
- Verify Ollama server is running

### Ollama connection errors

- Verify Ollama is running: `ollama serve`
- Check server URL in settings
- Ensure firewall allows port 11434

### No completions appearing

- Check `ollama.enableCompletion` is set to `true`
- Verify Ollama server is accessible
- Check model is loaded: `ollama list`
- Pull a model if needed: `ollama pull llama3.2`

### Slow completions

- Increase `ollama.completionDelay` if needed
- Ensure Ollama model is loaded
- Check network latency (if using remote server)

### Build errors

- Run `npm install` to reinstall dependencies
- Clear `node_modules` and rebuild: `rm -rf node_modules && npm install`

## Performance Tips

1. **Load models in advance**: Use `ollama pull` before using the extension
2. **Use smaller models for completions**: Models like `llama3.2` are faster for completions
3. **Adjust completion delay**: Increase `completionDelay` if completions feel too eager
4. **Limit suggestions**: Reduce `completionLimit` if too many suggestions appear

## Privacy & Security

- All code completion happens locally
- No code is sent to external servers
- Your data stays on your machine
- Ollama models run locally

## Supported Languages

- TypeScript
- JavaScript
- Python
- Java
- C#
- Go
- Rust
- And more (any language supported by your Ollama model)

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Trigger completion | `Ctrl+Space` |
| Accept suggestion | `Tab` |
| Dismiss suggestion | `Esc` |
| Run agent | `F1` -> "Ollama: Run Agent" |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

ISC

## Support

For issues or questions:
- Check VS Code output panel
- Review Ollama documentation: https://ollama.ai
- Open an issue in the repository

## Acknowledgments

- Built with VS Code Extension API
- Powered by Ollama local LLMs
- Inspired by AI coding assistants
