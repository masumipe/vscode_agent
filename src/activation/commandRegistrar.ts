import * as vscode from 'vscode';
import { OllamaService } from '../services/ollamaService';
import { AgentManager } from '../agents/agentManager';
import { CopilotAgent } from '../agents/copilotAgent';
import { ConfigService } from '../services/configService';
import { ChangeManager } from '../changes/changeManager';
import { ChatPanel } from '../gui/chatPanel';
import { Commands } from '../types/commands';
import { Logger } from '../telemetry/logger';

export class CommandRegistrar {
    private ollamaService: OllamaService;
    private agentManager: AgentManager;
    private copilotAgent: CopilotAgent;
    private changeManager: ChangeManager;
    private configService = ConfigService.getInstance();
    private logger = Logger.getInstance();
    private chatPanel: ChatPanel;

    constructor(
        ollamaService: OllamaService,
        agentManager: AgentManager,
        copilotAgent: CopilotAgent,
        changeManager: ChangeManager,
        chatPanel: ChatPanel,
    ) {
        this.ollamaService = ollamaService;
        this.agentManager = agentManager;
        this.copilotAgent = copilotAgent;
        this.changeManager = changeManager;
        this.chatPanel = chatPanel;
    }

    registerAll(context: vscode.ExtensionContext): void {
        this.registerChatCommands(context);
        this.registerAgentCommands(context);
        this.registerCodeActionCommands(context);
        this.registerCopilotCommands(context);
        this.registerChangeCommands(context);
    }

    private registerChatCommands(context: vscode.ExtensionContext): void {
        context.subscriptions.push(
            vscode.commands.registerCommand(Commands.Chat, async () => {
                this.chatPanel.show();
            }),
            vscode.commands.registerCommand(Commands.ChatSend, async () => {
                this.chatPanel.show();
                await this.chatPanel.sendUserMessage();
            }),
            vscode.commands.registerCommand(Commands.ChatClosePanel, async () => {
                this.chatPanel.dispose();
            }),
        );
    }

    private registerAgentCommands(context: vscode.ExtensionContext): void {
        context.subscriptions.push(
            vscode.commands.registerCommand(Commands.NewAgent, async () => {
                await this.createAgentInteractive();
            }),
            vscode.commands.registerCommand(Commands.AgentCreate, async () => {
                await this.createAgentInteractive();
            }),
            vscode.commands.registerCommand(Commands.AgentRun, async () => {
                const agents = this.agentManager.getAgents();
                if (agents.length === 0) {
                    vscode.window.showInformationMessage('No agents found. Create one first.');
                    return;
                }
                const pick = await vscode.window.showQuickPick(
                    agents.map(a => ({ label: a.name, description: a.id, agent: a })),
                    { placeHolder: 'Select agent to run' },
                );
                if (!pick) return;
                const prompt = await vscode.window.showInputBox({ placeHolder: 'Enter prompt for agent...' });
                if (!prompt) return;
                try {
                    const result = await this.agentManager.runAgent(pick.agent.id, prompt);
                    vscode.window.showInformationMessage(`Agent response: ${result.response.substring(0, 100)}...`);
                } catch (error) {
                    vscode.window.showErrorMessage(`Error running agent: ${error}`);
                }
            }),
            vscode.commands.registerCommand(Commands.AgentEvaluate, async () => {
                const agents = this.agentManager.getAgents();
                if (agents.length === 0) {
                    vscode.window.showInformationMessage('No agents found.');
                    return;
                }
                const pick = await vscode.window.showQuickPick(
                    agents.map(a => ({ label: a.name, description: a.id, agent: a })),
                    { placeHolder: 'Select agent to evaluate' },
                );
                if (!pick) return;
                const prompt = await vscode.window.showInputBox({ placeHolder: 'Evaluation criteria...' });
                if (!prompt) return;
                try {
                    const result = await this.agentManager.evaluateAgent(pick.agent.id, prompt);
                    vscode.window.showInformationMessage(`Evaluation: ${result.evaluation.substring(0, 100)}...`);
                } catch (error) {
                    vscode.window.showErrorMessage(`Error evaluating agent: ${error}`);
                }
            }),
            vscode.commands.registerCommand(Commands.AgentDebug, async () => {
                const agents = this.agentManager.getAgents();
                if (agents.length === 0) {
                    vscode.window.showInformationMessage('No agents found.');
                    return;
                }
                const pick = await vscode.window.showQuickPick(
                    agents.map(a => ({ label: a.name, description: a.id, agent: a })),
                    { placeHolder: 'Select agent to debug' },
                );
                if (!pick) return;
                const prompt = await vscode.window.showInputBox({ placeHolder: 'Debug prompt...' });
                if (!prompt) return;
                try {
                    const result = await this.agentManager.debugAgent(pick.agent.id, prompt);
                    vscode.window.showInformationMessage(`Debug output: ${result.debugOutput.substring(0, 100)}...`);
                } catch (error) {
                    vscode.window.showErrorMessage(`Error debugging agent: ${error}`);
                }
            }),
            vscode.commands.registerCommand(Commands.AgentStatus, () => {
                const count = this.agentManager.getAgents().length;
                const url = this.configService.serverUrl;
                const model = this.configService.defaultModel;
                vscode.window.showInformationMessage(
                    `Ollama Agent: ${count} agent(s) | Server: ${url} | Model: ${model}`,
                );
            }),
            vscode.commands.registerCommand(Commands.AcceptCompletion, () => {
                this.logger.debug('Completion accepted');
            }),
        );
    }

    private registerCodeActionCommands(context: vscode.ExtensionContext): void {
        const codeCommands: Array<{ command: string; title: string; systemPrompt: (code: string) => string }> = [
            {
                command: Commands.GenerateCode,
                title: 'code to generate',
                systemPrompt: (code: string) => `Generate code based on this context:\n\n${code}`,
            },
            {
                command: Commands.DebugCode,
                title: 'code to debug',
                systemPrompt: (code: string) => `Debug the following code and identify issues:\n\n${code}`,
            },
            {
                command: Commands.ExplainCode,
                title: 'code to explain',
                systemPrompt: (code: string) => `Explain the following code in detail:\n\n${code}`,
            },
            {
                command: Commands.Refactor,
                title: 'code to refactor',
                systemPrompt: (code: string) => `Refactor the following code for better readability and performance:\n\n${code}`,
            },
            {
                command: Commands.WriteTests,
                title: 'code to write tests for',
                systemPrompt: (code: string) => `Write comprehensive tests for the following code:\n\n${code}`,
            },
            {
                command: Commands.GenerateDocs,
                title: 'code to document',
                systemPrompt: (code: string) => `Generate documentation for the following code:\n\n${code}`,
            },
        ];

        for (const cmd of codeCommands) {
            context.subscriptions.push(
                vscode.commands.registerCommand(cmd.command, async () => {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor) {
                        vscode.window.showWarningMessage('Open a file first.');
                        return;
                    }
                    const selection = editor.selection;
                    const code = selection.isEmpty
                        ? editor.document.getText()
                        : editor.document.getText(selection);

                    if (!code.trim()) {
                        vscode.window.showWarningMessage('No code found to process.');
                        return;
                    }

                    const prompt = cmd.systemPrompt(code);
                    try {
                        const model = this.configService.defaultModel;
                        const response = await this.ollamaService.generate(prompt, model);
                        const doc = await vscode.workspace.openTextDocument({
                            content: response,
                            language: editor.document.languageId,
                        });
                        await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside });
                    } catch (error) {
                        vscode.window.showErrorMessage(`Error: ${error}`);
                    }
                }),
            );
        }
    }

    private registerCopilotCommands(context: vscode.ExtensionContext): void {
        context.subscriptions.push(
            vscode.commands.registerCommand('ollama.copilot.ask', async () => {
                const editor = vscode.window.activeTextEditor;
                const context_ = editor
                    ? { fileName: editor.document.fileName, language: editor.document.languageId }
                    : {};
                const task = await vscode.window.showInputBox({ placeHolder: 'Ask the AI agent...' });
                if (!task) return;
                const result = await this.copilotAgent.ask(task, context_);
                const doc = await vscode.workspace.openTextDocument({ content: result, language: 'markdown' });
                await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside });
            }),
            vscode.commands.registerCommand('ollama.copilot.readEditor', async () => {
                const content = await this.copilotAgent.readEditor();
                vscode.window.showInformationMessage(content.substring(0, 200));
            }),
            vscode.commands.registerCommand('ollama.copilot.readFile', async () => {
                const uris = await vscode.window.showOpenDialog({ canSelectMany: false });
                if (!uris || uris.length === 0) return;
                const content = await this.copilotAgent.readFile(uris[0]);
                const doc = await vscode.workspace.openTextDocument({ content, language: 'plaintext' });
                await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside });
            }),
            vscode.commands.registerCommand('ollama.copilot.writeFile', async () => {
                const uri = await vscode.window.showSaveDialog({});
                if (!uri) return;
                const content = await vscode.window.showInputBox({ placeHolder: 'File content...', prompt: 'Enter file content' });
                if (content === undefined) return;
                const success = await this.copilotAgent.writeFile(uri, content);
                vscode.window.showInformationMessage(success ? 'File written successfully' : 'Failed to write file');
            }),
            vscode.commands.registerCommand('ollama.copilot.deleteFile', async () => {
                const uris = await vscode.window.showOpenDialog({ canSelectMany: false });
                if (!uris || uris.length === 0) return;
                const confirm = await vscode.window.showWarningMessage(
                    `Delete ${uris[0].fsPath}?`, { modal: true }, 'Yes',
                );
                if (confirm !== 'Yes') return;
                const success = await this.copilotAgent.deleteFile(uris[0]);
                vscode.window.showInformationMessage(success ? 'File deleted' : 'Failed to delete file');
            }),
            vscode.commands.registerCommand('ollama.copilot.insertCode', async () => {
                const editor = vscode.window.activeTextEditor;
                if (!editor) { vscode.window.showWarningMessage('Open a file first.'); return; }
                const code = await vscode.window.showInputBox({ placeHolder: 'Code to insert...' });
                if (!code) return;
                const pos = editor.selection.active;
                await this.copilotAgent.insertCode(editor.document.uri, pos, code);
            }),
            vscode.commands.registerCommand('ollama.copilot.runCode', async () => {
                const cmd = await vscode.window.showInputBox({ placeHolder: 'Command to execute...' });
                if (!cmd) return;
                const result = await this.copilotAgent.runCode(cmd);
                vscode.window.showInformationMessage(`Exit: ${result.error ? 'error' : 'ok'}\n${result.stdout.substring(0, 300)}`);
            }),
            vscode.commands.registerCommand('ollama.copilot.testCode', async () => {
                const editor = vscode.window.activeTextEditor;
                if (!editor) { vscode.window.showWarningMessage('Open a test file first.'); return; }
                const result = await this.copilotAgent.testCode(editor.document.uri);
                vscode.window.showInformationMessage(`Test result: ${result.error ? result.stderr.substring(0, 200) : result.stdout.substring(0, 200)}`);
            }),
            vscode.commands.registerCommand('ollama.copilot.debugCode', async () => {
                const editor = vscode.window.activeTextEditor;
                if (!editor) { vscode.window.showWarningMessage('Open a file first.'); return; }
                const result = await this.copilotAgent.debugCode(editor.document.uri);
                vscode.window.showInformationMessage(result);
            }),
            vscode.commands.registerCommand('ollama.copilot.browseWeb', async () => {
                const url = await vscode.window.showInputBox({ placeHolder: 'URL to browse...' });
                if (!url) return;
                const result = await this.copilotAgent.browseWeb(url);
                vscode.window.showInformationMessage(result);
            }),
            vscode.commands.registerCommand('ollama.copilot.executeCommand', async () => {
                const cmd = await vscode.window.showInputBox({ placeHolder: 'Command to execute...' });
                if (!cmd) return;
                const result = await this.copilotAgent.executeCommand(cmd);
                vscode.window.showInformationMessage(result.substring(0, 300));
            }),
            vscode.commands.registerCommand('ollama.copilot.status', () => {
                const perms = this.copilotAgent.getPermissionsString();
                vscode.window.showInformationMessage(`AI Agent permissions: ${perms}`);
            }),
        );
    }

    private async createAgentInteractive(): Promise<void> {
        const name = await vscode.window.showInputBox({
            title: 'Create New AI Agent',
            placeHolder: 'Enter agent name...',
        });
        if (!name) return;

        const description = await vscode.window.showInputBox({
            title: 'Agent Description',
            placeHolder: 'Brief description...',
        });

        try {
            const agent = await this.agentManager.createAgent(name, description || undefined);
            vscode.window.showInformationMessage(`Created agent "${agent.name}" successfully!`);
        } catch (error) {
            this.logger.error('Error creating agent:', error);
            vscode.window.showErrorMessage(`Failed to create agent: ${error}`);
        }
    }

    private registerChangeCommands(context: vscode.ExtensionContext): void {
        context.subscriptions.push(
            vscode.commands.registerCommand(Commands.ChangesAccept, async (uri?: vscode.Uri) => {
                const target = uri || vscode.window.activeTextEditor?.document.uri;
                if (!target) {
                    vscode.window.showWarningMessage('No file with pending changes selected.');
                    return;
                }
                const ok = await this.changeManager.acceptChange(target);
                vscode.window.showInformationMessage(ok ? 'Changes accepted.' : 'No pending changes found.');
            }),
            vscode.commands.registerCommand(Commands.ChangesReject, async (uri?: vscode.Uri) => {
                const target = uri || vscode.window.activeTextEditor?.document.uri;
                if (!target) {
                    vscode.window.showWarningMessage('No file with pending changes selected.');
                    return;
                }
                const ok = await this.changeManager.rejectChange(target);
                vscode.window.showInformationMessage(ok ? 'Changes rejected and reverted.' : 'No pending changes found.');
            }),
            vscode.commands.registerCommand(Commands.ChangesAcceptAll, async () => {
                const count = await this.changeManager.acceptAll();
                vscode.window.showInformationMessage(`Accepted ${count} change(s).`);
            }),
            vscode.commands.registerCommand(Commands.ChangesRejectAll, async () => {
                const count = await this.changeManager.rejectAll();
                vscode.window.showInformationMessage(`Rejected ${count} change(s).`);
            }),
            vscode.commands.registerCommand(Commands.ChangesShow, async () => {
                const pending = this.changeManager.getAllPending();
                if (pending.length === 0) {
                    vscode.window.showInformationMessage('No pending changes.');
                    return;
                }
                const items = pending.map(e => ({
                    label: e.uri.fsPath.split(/[\\/]/).pop() || e.uri.fsPath,
                    description: `${e.ranges.length} block(s) changed`,
                    detail: e.uri.fsPath,
                    uri: e.uri,
                }));
                const pick = await vscode.window.showQuickPick(items, { placeHolder: 'Select a file to review changes' });
                if (pick) {
                    const doc = await vscode.workspace.openTextDocument(pick.uri);
                    await vscode.window.showTextDocument(doc, { preview: false });
                }
            }),
        );
    }
}
