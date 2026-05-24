# Copilot-like GUI for Ollama Agent Extension

## Overview

A Copilot-like chat interface has been created for the Ollama Agent Extension, providing an interactive web-based chat panel that mimics the GitHub Copilot experience.

## New Files Created

### `src/gui/ollamaChatPanel.ts`
Main chat panel implementation with:
- Webview panel creation and management
- HTML/CSS/JavaScript embedded chat interface
- Markdown parsing for code formatting
- Conversation history management
- Model selection UI

### `src/gui/chatCommands.ts`
Chat commands module providing:
- `openPanel()` - Opens the chat panel
- `sendMessage()` - Sends messages to Ollama
- `closePanel()` - Closes the chat panel
- `updatePanel()` - Updates panel with current configuration

## Updated Files

### `src/extension.ts`
- Added `OllamaChatPanel` import
- Initialized chat panel on activation
- Registered new commands:
  - `ollama.chat.openPanel` - Open chat panel
  - `ollama.chat.send` - Send message in chat
  - `ollama.chat.closePanel` - Close chat panel

### `package.json`
- Added new commands to contributes section:
  - `ollama.chat.openPanel`
  - `ollama.chat.send`
  - `ollama.chat.closePanel`
- Added view menu configuration for chat panel

## Features

### Chat Interface
- **Dark Theme**: VS Code-inspired dark theme
- **Responsive Design**: Works in different panel sizes
- **Markdown Support**: Basic markdown parsing for code blocks, headers, etc.
- **Conversation History**: Maintains context across multiple messages
- **Model Selection**: Choose from available models (llama3.2, llama3.1, mistral, codellama)

### User Interface
```
┌─────────────────────────────────────┐
│ 🤖 Ollama Agent          [Close]    │
├─────────────────────────────────────┤
│                                     │
│ Ollama Agent is ready. Select a     │
│ model and start chatting!            │
│                                     │
│ [Model: llama3.2]                   │
│                                     │
│ [Your message here...]              │
│ [Send]                              │
│                                     │
└─────────────────────────────────────┘
```

### Message Types
- **User Messages**: Blue background, right-aligned
- **Assistant Messages**: Dark background, left-aligned with markdown support
- **System Messages**: Gray background, centered (for errors, loading, etc.)

## Usage

### Opening the Chat Panel
1. Press `Ctrl+Shift+P` (or `F1`)
2. Type `Ollama: Open Chat Panel`
3. Press Enter

Or use the command palette:
- `Ctrl+Shift+P` → `Ollama: Open Chat Panel`

### Sending Messages
1. Type your message in the chat panel
2. Press Enter to send (or click Send button)
3. Use Shift+Enter for multiple lines

### Closing the Panel
- Click the "Close Panel" button in the header
- Use `Ctrl+Shift+P` → `Ollama: Close Chat Panel`

## Configuration

The chat panel uses VS Code settings:
```json
{
  "ollama.serverUrl": "http://localhost:11434",
  "ollama.defaultModel": "llama3.2"
}
```

## Technical Details

### Webview Panel
- Uses `vscode.WebviewPanel` for the chat interface
- Scripts are enabled for JavaScript execution
- Context is retained when panel is hidden

### API Integration
- Uses `fetch()` to call Ollama API at `/api/chat`
- Supports conversation history via `messages` array
- Returns formatted response from Ollama

### Markdown Parsing
Basic markdown support includes:
- Headers (`#`, `##`, `###`)
- Bold (`**text**`)
- Italic (`*text*`)
- Inline code (`code`)
- Code blocks (``` ```)
- Line breaks (`\n`)

## Future Enhancements

Potential improvements:
1. **Streaming Responses**: Implement Ollama streaming API for real-time updates
2. **Code Highlighting**: Integrate Monaco Editor for syntax highlighting
3. **File Upload**: Support uploading files for analysis
4. **Agent Integration**: Connect with existing agent system
5. **History Management**: Save and load chat history
6. **Quick Actions**: Add quick action buttons for common tasks

## Commands Reference

| Command | Description |
|---------|-------------|
| `ollama.chat.openPanel` | Open the chat panel |
| `ollama.chat.send` | Send a message in the chat |
| `ollama.chat.closePanel` | Close the chat panel |

## Troubleshooting

### Panel Won't Open
- Ensure Ollama server is running
- Check VS Code settings for correct server URL
- Verify extension is activated

### No Response from Ollama
- Check Ollama server is running: `curl http://localhost:11434/api/tags`
- Verify server URL in VS Code settings
- Check network connectivity

### HTML Rendering Issues
- Ensure webview scripts are enabled
- Check for JavaScript console errors in the panel

## Architecture

```
extension.ts (main)
├── OllamaChatPanel (gui/ollamaChatPanel.ts)
│   ├── createOrCreate() - Initialize panel
│   ├── sendChatMessage() - Send messages
│   └── getHtmlContent() - Generate HTML
├── ChatCommands (gui/chatCommands.ts)
│   ├── openPanel()
│   ├── sendMessage()
│   └── closePanel()
└── OllamaService (services/ollamaService.ts)
    └── chat() - API integration
```

## License

Same as the main extension - ISC
