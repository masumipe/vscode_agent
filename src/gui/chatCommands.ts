import * as vscode from 'vscode';
import { AgentManager } from '../agents/agentManager';

export class ChatCommandHandler {
    private extension: any; // OllamaExtension instance
    
    constructor(extension: any) {
        this.extension = extension;
    }

    registerChatCommands(context: vscode.ExtensionContext): void {
        const commands = [
            // Send message command - triggers the chat panel's send functionality  
            vscode.commands.registerCommand('ollama.chat.send', async () => {
                await vscode.window.showInformationMessage('Send button clicked! Opening chat...');
                await vscode.commands.executeCommand('ollama.chat');
            }),

            // Close panel command  
            vscode.commands.registerCommand('ollama.chat.closePanel', async () => {
                if (vscode.window.activeTextEditor) {
                    await vscode.commands.executeCommand('workbench.action.closePanel');
                } else {
                    const confirm = await vscode.window.showWarningMessage(
                        'Close chat panel?', 
                        { modal: true },
                        'Yes',
                        'Cancel'
                    );
                    if (confirm === 'Yes') {
                        // Find and dispose the OllamaChatPanel by searching for it in subscriptions would be complex,
                        // so we'll just close any open panels or show a message instead
                        vscode.window.showInformationMessage('Closing chat panel...');
                    }
                }
            }),

            // Main chat command - opens the panel  
            vscode.commands.registerCommand('ollama.chat', async () => {
                await vscode.commands.executeCommand('workbench.action.openPanel');
            }),

            // Agent creation commands (for newAgent and create agent)
            vscode.commands.registerCommand('ollama.newAgent', async () => {
                const name = await vscode.window.showInputBox({
                    title: 'Create New AI Agent',
                    placeHolder: 'Enter agent name...',
                    prompt: 'What is the purpose of this agent?'
                });

                if (name) {
                    const description = await vscode.window.showInputBox({
                        title: 'Agent Description',
                        placeHolder: 'Brief description...',
                    });

                    try {
                        // Create the agent using AgentManager
                        let model = vscode.workspace.getConfiguration('ollama').get('defaultModel', 'llama3.2');
                        
                        if (description) {
                            const finalDescription = `You are ${name}. Your purpose is: ${description}`;
                            
                            await this.extension.agentManager.createAgent(name, finalDescription);
                            vscode.window.showInformationMessage(`Created agent "${name}" successfully!`);
                        } else {
                            // Use default description if not provided
                            const defaultDesc = `You are ${name}. Be helpful and accurate.`;
                            await this.extension.agentManager.createAgent(name, defaultDesc);
                            vscode.window.showInformationMessage(`Created agent "${name}" with default instructions!`);
                        }
                    } catch (error) {
                        console.error('Error creating agent:', error);
                        vscode.window.showErrorMessage(`Failed to create agent: ${error}`);
                    }
                }
            }),

            // Create new agent command  
            vscode.commands.registerCommand('ollama.agent.create', async () => {
                const name = await vscode.window.showInputBox({
                    title: 'Create New AI Agent',
                    placeHolder: 'Enter agent name...',
                    prompt: 'What is the purpose of this agent?'
                });

                if (name) {
                    const description = await vscode.window.showInputBox({
                        title: 'Agent Description',
                        placeHolder: 'Brief description...',
                    });

                    try {
                        // Create the agent using AgentManager  
                        let model = vscode.workspace.getConfiguration('ollama').get('defaultModel', 'llama3.2');
                        
                        if (description) {
                            const finalDescription = `You are ${name}. Your purpose is: ${description}`;
                            
                            await this.extension.agentManager.createAgent(name, finalDescription);
                            vscode.window.showInformationMessage(`Created agent "${name}" successfully!`);
                        } else {
                            // Use default description if not provided  
                            const defaultDesc = `You are ${name}. Be helpful and accurate.`;
                            await this.extension.agentManager.createAgent(name, defaultDesc);
                            vscode.window.showInformationMessage(`Created agent "${name}" with default instructions!`);
                        }
                    } catch (error) {
                        console.error('Error creating agent:', error);
                        vscode.window.showErrorMessage(`Failed to create agent: ${error}`);
                    }
                }
            }),

        ];

        for (const command of commands) {
            context.subscriptions.push(command);
        }
    }
}
