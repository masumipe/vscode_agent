import * as vscode from 'vscode';
import { OllamaService, ChatMessage } from '../services/ollamaService';
import * as fs from 'fs';
import * as path from 'path';

export interface Agent {
    id: string;
    name: string;
    description: string;
    model: string;
    instructions: string;
    capabilities: string[];
    createdAt: Date;
    updatedAt: Date;
    configuration: any;
}

export interface AgentTrace {
    id: string;
    agentId: string;
    agentName: string;
    timestamp: Date;
    type: 'thought' | 'action' | 'observation' | 'result';
    content: string;
    metadata: any;
}

export class AgentManager {
    private agents: Map<string, Agent> = new Map();
    private traces: Map<string, AgentTrace[]> = new Map();
    private ollamaService: OllamaService;
    private configPath: string;

    constructor(ollamaService: OllamaService) {
        this.ollamaService = ollamaService;
        const storagePath = process.env.VSCODE_USER_DATA
            ? path.join(process.env.VSCODE_USER_DATA, 'Code - Insiders/User/globalStorage/vscode-ollama-agent')
            : path.join(__dirname, '..', '..', '.agent-storage');
        this.configPath = path.join(storagePath, 'agents.json');
    }

    async createAgent(name: string): Promise<Agent> {
        const agentId = this.generateAgentId(name);

        const agent: Agent = {
            id: agentId,
            name,
            description: `Agent ${name} created at ${new Date().toISOString()}`,
            model: vscode.workspace.getConfiguration('ollama').get('defaultModel', 'llama3.2'),
            instructions: 'You are a helpful AI assistant.',
            capabilities: ['chat', 'reasoning'],
            createdAt: new Date(),
            updatedAt: new Date(),
            configuration: {},
        };

        this.agents.set(agentId, agent);
        await this.saveAgents();

        return agent;
    }

    async loadAgent(agentId: string): Promise<Agent | undefined> {
        return this.agents.get(agentId);
    }

    async loadAgentConfiguration(configPath: string): Promise<void> {
        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

            const agentId = config.id || this.generateAgentId(config.name);
            const agent: Agent = {
                id: agentId,
                name: config.name,
                description: config.description || '',
                model: config.model || 'llama3.2',
                instructions: config.instructions || 'You are a helpful AI assistant.',
                capabilities: config.capabilities || ['chat', 'reasoning'],
                createdAt: config.createdAt || new Date(),
                updatedAt: new Date(),
                configuration: config.configuration || {},
            };

            this.agents.set(agentId, agent);
            await this.saveAgents();
        } catch (error) {
            console.error('Failed to load agent configuration:', error);
        }
    }

    async runAgent(agentId: string, prompt: string): Promise<any> {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
        }

        const messages: ChatMessage[] = [
            { role: 'system', content: agent.instructions },
            { role: 'user', content: prompt },
        ];

        try {
            const response = await this.ollamaService.generateChat(agent.model, messages, {
                temperature: 0.7,
                num_predict: 1024,
            });

            const trace: AgentTrace = {
                id: this.generateTraceId(agentId),
                agentId,
                agentName: agent.name,
                timestamp: new Date(),
                type: 'result',
                content: response.message?.content || response.response,
                metadata: {
                    model: agent.model,
                    tokens: response.usage?.total_tokens,
                },
            };

            const existingTraces = this.traces.get(agentId) || [];
            existingTraces.push(trace);
            this.traces.set(agentId, existingTraces);

            return response;
        } catch (error) {
            console.error(`Error running agent ${agentId}:`, error);
            throw error;
        }
    }

    async evaluateAgent(agentId: string, evaluationPrompt: string): Promise<any> {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
        }

        const messages: ChatMessage[] = [
            { role: 'system', content: `You are an evaluator. Evaluate the agent "${agent.name}".` },
            { role: 'user', content: evaluationPrompt },
        ];

        try {
            const response = await this.ollamaService.generateChat(agent.model, messages, {
                temperature: 0.5,
                num_predict: 512,
            });

            return {
                agentId,
                agentName: agent.name,
                evaluation: response.message?.content || response.response,
                timestamp: new Date(),
            };
        } catch (error) {
            console.error(`Error evaluating agent ${agentId}:`, error);
            throw error;
        }
    }

    async debugAgent(agentId: string, debugPrompt: string): Promise<any> {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
        }

        const messages: ChatMessage[] = [
            { role: 'system', content: `Debug the agent "${agent.name}". Show its thought process and reasoning.` },
            { role: 'user', content: debugPrompt },
        ];

        try {
            const response = await this.ollamaService.generateChat(agent.model, messages, {
                temperature: 0.8,
                num_predict: 2048,
            });

            return {
                agentId,
                agentName: agent.name,
                debugOutput: response.message?.content || response.response,
                timestamp: new Date(),
            };
        } catch (error) {
            console.error(`Error debugging agent ${agentId}:`, error);
            throw error;
        }
    }

    getAgents(): Agent[] {
        return Array.from(this.agents.values());
    }

    getTraces(agentId: string): AgentTrace[] {
        return this.traces.get(agentId) || [];
    }

    getAllTraces(): AgentTrace[] {
        const allTraces: AgentTrace[] = [];
        for (const traces of this.traces.values()) {
            allTraces.push(...traces);
        }
        return allTraces;
    }

    private async saveAgents(): Promise<void> {
        const agentsData = {
            agents: Array.from(this.agents.values()),
            traces: Array.from(this.traces.entries()).map(([agentId, traces]) => ({
                agentId,
                traces,
            })),
        };

        try {
            fs.mkdirSync(path.dirname(this.configPath), { recursive: true });
            fs.writeFileSync(this.configPath, JSON.stringify(agentsData, null, 2));
        } catch (error) {
            console.error('Failed to save agents:', error);
        }
    }

    private generateAgentId(name: string): string {
        return `agent_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    }

    private generateTraceId(agentId: string): string {
        return `${agentId}_trace_${Date.now()}`;
    }

    async getCompletionSuggestions(
        code: string,
        position: number,
        language: string,
    ): Promise<string[]> {
        try {
            const model = vscode.workspace.getConfiguration('ollama').get('defaultModel', 'llama3.2');
            const context = code.substring(Math.max(0, position - 500), position);
            const prompt = `Provide 5 code completion suggestions for:\n\nContext:\n${context}\n\nCursor position: ${position}\n\nLanguage: ${language}\n\nReturn suggestions as a JSON array.`;

            const response = await this.ollamaService.generate(prompt, model as string);

            const jsonMatch = response.match(/\[.*\]/s);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            return [];
        } catch (error) {
            console.error('Error getting completion suggestions:', error);
            return [];
        }
    }
}
