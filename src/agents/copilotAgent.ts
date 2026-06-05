import { OllamaService } from '../services/ollamaService';
import { AutonomousAgent } from './autonomousAgent';

export class CopilotAgent extends AutonomousAgent {
    constructor(ollamaService: OllamaService) {
        super(ollamaService, 'ollama.autonomous');
    }

    async ask(task: string, context?: unknown): Promise<string> {
        const currentPermissions = this.getPermissionsString();
        const systemPrompt = [
            'You are an AI coding assistant that can:',
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
            return await this.ollamaService.generate(systemPrompt);
        } catch (error) {
            this.logger.error('Agent error:', error);
            return `Error: ${String(error)}`;
        }
    }
}
