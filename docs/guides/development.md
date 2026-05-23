# Ollama Agent Extension - Development Guide

## Overview

This VS Code extension provides AI agent capabilities with local Ollama server integration. It allows you to:

- Create and manage AI agents
- Run agents with prompts
- Evaluate agent performance
- Debug agent behavior
- View agent traces and logs

## Architecture

```
src/
├── extension.ts          # Main extension entry point
├── agents/
│   └── agentManager.ts   # Agent management logic
├── services/
│   └── ollamaService.ts  # Ollama API client
├── utils/
│   └── ollamaLanguageService.ts  # Language service features
└── config/
    └── settings.json     # Extension configuration
```

## Key Features

### 1. Agent Management

- **Create Agents**: Define new AI agents with custom instructions
- **Run Agents**: Execute agents with user prompts
- **Evaluate Agents**: Assess agent performance
- **Debug Agents**: Inspect agent behavior and reasoning

### 2. Ollama Integration

- Connect to local Ollama server
- Support for multiple models
- Chat and completion generation
- Embedding creation

### 3. Tracing and Logging

- View agent execution traces
- Monitor agent interactions
- Debug agent workflows

## Development Workflow

### 1. Start Ollama Server

Ensure Ollama is running:

```powershell
ollama serve
```

### 2. Configure Extension

Edit `.vscode/settings.json`:

```json
{
    "ollama.serverUrl": "http://localhost:11434",
    "ollama.defaultModel": "llama3.2",
    "ollama.enableTracing": true,
    "ollama.maxTokens": 4096
}
```

### 3. Load Extension in VS Code

```powershell
code --extensionDevelopmentPath=d:\Myfiles\vscodeagent\vscode-ollama-agent-extension
```

### 4. Debug the Extension

1. Press `F5` to start debugging
2. Set breakpoints in your code
3. Interact with the extension commands

## Available Commands

### Create Agent

Creates a new AI agent:

```
Ollama: Create New Agent
```

### Run Agent

Executes an agent with a prompt:

```
Ollama: Run Agent
```

### Evaluate Agent

Evaluates agent performance:

```
Ollama: Evaluate Agent
```

### Debug Agent

Debugs agent behavior:

```
Ollama: Debug Agent
```

## Testing

### Unit Tests

Create tests in `tests/unit/`:

```typescript
import { AgentManager } from '../../src/agents/agentManager';
import { OllamaService } from '../../src/services/ollamaService';

describe('AgentManager', () => {
    let agentManager: AgentManager;
    let ollamaService: OllamaService;

    beforeEach(() => {
        ollamaService = new OllamaService();
        agentManager = new AgentManager(ollamaService);
    });

    it('should create an agent', async () => {
        const agent = await agentManager.createAgent('Test Agent');
        expect(agent.name).toBe('Test Agent');
    });
});
```

### Integration Tests

Create integration tests in `tests/integration/`:

```typescript
import { OllamaService } from '../../src/services/ollamaService';

describe('OllamaService', () => {
    let ollamaService: OllamaService;

    beforeEach(() => {
        ollamaService = new OllamaService();
    });

    it('should connect to Ollama server', async () => {
        const response = await ollamaService.healthCheck('http://localhost:11434');
        expect(response.status).toBe(200);
    });
});
```

## Building the Extension

### Compile

```powershell
npm run compile
```

### Watch Mode

```powershell
npm run watch
```

### Test

```powershell
npm test
```

## Publishing

### Package as VSIX

```powershell
npm pack
```

### Publish to Marketplace

1. Sign in to VS Code Marketplace
2. Upload the `.vsix` file
3. Fill in metadata
4. Publish

## Troubleshooting

### Extension doesn't load

- Check VS Code output panel for errors
- Ensure TypeScript compilation succeeded
- Verify Ollama server is running

### Ollama connection errors

- Verify Ollama is running: `ollama serve`
- Check server URL in settings
- Ensure firewall allows port 11434

### Build errors

- Run `npm install` to reinstall dependencies
- Clear `node_modules` and rebuild: `rm -rf node_modules && npm install`

## Next Steps

1. Customize agent configurations
2. Add new features and capabilities
3. Write comprehensive tests
4. Package and publish to marketplace

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Ollama Documentation](https://ollama.ai)
- [VS Code Marketplace](https://marketplace.visualstudio.com)
