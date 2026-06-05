import * as vscode from 'vscode';
import { OllamaService } from '../services/ollamaService';
import { AutonomousAgent } from './autonomousAgent';
import { AgentPermission } from './permissions';

export { AgentPermission } from './permissions';

export class GitHubCopilotAgent extends AutonomousAgent {
    constructor(ollamaService: OllamaService) {
        super(ollamaService, 'githubCopilot');
    }

    async ask(task: string, context?: any): Promise<string> {
        const currentPermissions = this.getPermissionsString();
        const systemPrompt = [
            'You are GitHub Copilot - an AI coding assistant that can:',
            '1. Read from editor, terminal, and folder',
            '2. Edit and modify files when permitted',
            '3. Run, test, and debug code when allowed',
            '',
            `Current permissions: ${currentPermissions}`,
            '',
            `Task: ${task}`,
            `Context: ${JSON.stringify(context || {})}`,
            '',
            'Provide a step-by-step plan and, where appropriate, the exact changes or commands to execute.',
        ].join('\n');

        try {
            const model = vscode.workspace.getConfiguration('ollama').get('defaultModel', 'llama3.2');
            return await this.ollamaService.generate(systemPrompt, model as string);
        } catch (error) {
            console.error('Agent error:', error);
            return `Error: ${String(error)}`;
        }
    }
}
