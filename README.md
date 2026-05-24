# Ollama Agent Extension - Code Completion

## Overview

A powerful VS Code extension that integrates with local Ollama servers to provide AI-powered code completion, intelligent suggestions, and agent-based code assistance. This extension leverages local LLMs to provide context-aware completions across multiple programming languages.

## Features

- **AI-Powered Code Completion**: Get intelligent code suggestions powered by local Ollama models
- **Multi-Language Support**: Works with TypeScript, JavaScript, Python, Java, C#, Go, Rust, and more
- **Context-Aware Suggestions**: Completions based on surrounding code context
- **Agent-Based Assistance**: Create and run AI agents for complex code tasks
- **Real-Time Diagnostics**: AI-powered code analysis and error detection
- **Copilot-like Chat GUI**: Interactive chat panel for conversational AI assistance
- **Local Privacy**: All processing happens locally - no data sent to external servers
- **Customizable Models**: Choose from any model available in your Ollama installation

## Prerequisites

Before running the setup script, ensure you have:

1. **Node.js** (v18 or later) installed
2. **npm** (v8 or later) installed
3. **Ollama** installed and running locally
4. **VS Code** installed

## Quick Start

### Step 1: Run Setup Script

Execute the following PowerShell command in your terminal:

```powershell
cd d:\Myfiles\vscodeagent\vscode-ollama-agent-extension
.\setup.ps1
```

This will create the complete folder structure for the extension.

### Step 2: Initialize npm Project

After running the setup script, initialize the npm project:

```powershell
npm init
```

### Step 3: Install Dependencies

Install all required dependencies:

```powershell
npm install
```

### Step 4: Verify Ollama Server

Ensure Ollama is running:

```powershell
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not running, start Ollama
ollama serve
```

### Step 5: Build the Extension

Compile the TypeScript code:

```powershell
npm run compile
```

### Step 6: Load Extension in VS Code

1. Open VS Code
2. Press `F1` or `Ctrl+Shift+P`
3. Type `Extensions: Install from VSIX`
4. Navigate to the built extension file (usually in `out/`)

Or use the `vscode:extension` protocol to load from source:

```powershell
code-insiders --extensionDevelopmentPath=d:\Myfiles\vscodeagent\vscode-ollama-agent-extension
```

## Code Completion Features

### Using AI Completions

1. **Trigger Completions**: Press `Ctrl+Space` or use the inline suggestion widget
2. **Accept Suggestion**: Press `Tab` or click the suggestion
3. **Dismiss**: Press `Esc`

### Configuration Options

Edit `.vscode/settings.json` to configure:

```json
{
  "ollama.serverUrl": "http://localhost:11434",
  "ollama.defaultModel": "llama3.2",
  "ollama.enableCompletion": true,
  "ollama.completionDelay": 300,
  "ollama.completionLimit": 10,
  "ollama.maxTokens": 4096,
  "ollama.enableTracing": true
}
```

### Available Commands

- **Ollama: Create New Agent** - Create a new AI agent for code assistance
- **Ollama: Run Agent** - Execute an agent with a code-related prompt
- **Ollama: Evaluate Agent** - Evaluate agent performance on code tasks
- **Ollama: Debug Agent** - Debug agent behavior and suggestions
- **Ollama: Accept Completion** - Accept the current AI suggestion
- **Ollama: Toggle Status** - Enable/disable the extension status bar

### Code Completion Examples

#### TypeScript/JavaScript

```typescript
// The AI will suggest:
// - Common imports (React, axios, etc.)
// - Type definitions
// - Function signatures
// - Best practice patterns

import React from 'react';
import { useState, useEffect } from 'react';
import axios from 'axios';
```

#### Python

```python
# The AI will suggest:
# - Standard library imports
# - Popular packages (pandas, numpy, etc.)
# - Type hints
# - Common patterns

import pandas as pd
import numpy as np
from typing import List, Dict
```

## Development Workflow

### Debugging

1. Open the extension in VS Code
2. Set breakpoints in your code
3. Press `F5` to start debugging

### Testing

Run tests:

```powershell
npm test
```

### Watch Mode

Compile with watch mode for auto-rebuild:

```powershell
npm run watch
```

## Architecture

### Extension Structure

```
vscode-ollama-agent-extension/
├── src/
│   ├── extension.ts              # Main extension entry point
│   ├── services/
│   │   └── ollamaService.ts      # Ollama API client
│   ├── agents/
│   │   └── agentManager.ts       # Agent management
│   └── utils/
│       └── ollamaLanguageService.ts  # Language service for completions
├── out/                          # Compiled output
├── package.json                  # Extension manifest
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
```

### Key Components

- **OllamaService**: Handles communication with Ollama API
- **AgentManager**: Manages AI agents and their configurations
- **OllamaLanguageService**: Provides completion, hover, and diagnostic capabilities
- **Extension**: Main entry point that initializes all components

## Configuration

### Ollama Server Settings

- `ollama.serverUrl`: Ollama server URL (default: `http://localhost:11434`)
- `ollama.defaultModel`: Default model for completions (default: `llama3.2`)
- `ollama.enableCompletion`: Enable AI completions (default: `true`)
- `ollama.completionDelay`: Delay in ms before showing completions (default: `300`)
- `ollama.completionLimit`: Max number of suggestions (default: `10`)
- `ollama.maxTokens`: Maximum tokens for responses (default: `4096`)
- `ollama.enableTracing`: Enable agent tracing (default: `true`)

## Usage Examples

### Creating a Code Review Agent

```powershell
# Create a code review agent
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
