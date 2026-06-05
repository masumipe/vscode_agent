import * as vscode from 'vscode';
import * as path from 'path';
import { OllamaService } from '../services/ollamaService';
import { ConfigService } from '../services/configService';
import { AgentStore } from '../storage/agentStore';
import { TraceStore } from '../storage/traceStore';
import { AgentConfig, AgentTrace, ChatMessage } from '../types';
import { Logger } from '../telemetry/logger';

export class AgentManager {
    private agents: Map<string, AgentConfig> = new Map();
    private traces: Map<string, AgentTrace[]> = new Map();
    private agentStore: AgentStore;
    private traceStore: TraceStore;
    private ollamaService: OllamaService;
    private configService = ConfigService.getInstance();
    private logger = Logger.getInstance();

    constructor(ollamaService: OllamaService) {
        this.ollamaService = ollamaService;
        const storageDir = path.join(__dirname, '..', '..', '.agent-storage');
        this.agentStore = new AgentStore(storageDir);
        this.traceStore = new TraceStore(storageDir);
        this.loadPersisted();
    }

    private loadPersisted(): void {
        const agents = this.agentStore.load();
        agents.forEach(a => this.agents.set(a.id, a));
        const traces = this.traceStore.load();
        for (const trace of traces) {
            const list = this.traces.get(trace.agentId) || [];
            list.push(trace);
            this.traces.set(trace.agentId, list);
        }
    }

    async createAgent(name: string, description?: string): Promise<AgentConfig> {
        const agentId = this.generateAgentId(name);
        const agent: AgentConfig = {
            id: agentId,
            name,
            description: description || `Agent ${name} created at ${new Date().toISOString()}`,
            model: this.configService.defaultModel,
            instructions: description
                ? `You are ${name}. Your purpose is: ${description}`
                : 'You are a helpful AI assistant.',
            capabilities: ['chat', 'reasoning'],
            createdAt: new Date(),
            updatedAt: new Date(),
            configuration: {},
        };

        this.agents.set(agentId, agent);
        this.persistAgents();
        return agent;
    }

    loadAgent(agentId: string): AgentConfig | undefined {
        return this.agents.get(agentId);
    }

    async loadAgentConfiguration(configPath: string): Promise<void> {
        try {
            const fs = await import('fs');
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            const agentId = config.id || this.generateAgentId(config.name);
            const agent: AgentConfig = {
                id: agentId,
                name: config.name,
                description: config.description || '',
                model: config.model || this.configService.defaultModel,
                instructions: config.instructions || 'You are a helpful AI assistant.',
                capabilities: config.capabilities || ['chat', 'reasoning'],
                createdAt: config.createdAt ? new Date(config.createdAt) : new Date(),
                updatedAt: new Date(),
                configuration: config.configuration || {},
            };

            this.agents.set(agentId, agent);
            this.persistAgents();
        } catch (error) {
            this.logger.error('Failed to load agent configuration:', error);
        }
    }

    async runAgent(agentId: string, prompt: string): Promise<AgentConfig & { response: string }> {
        const agent = this.agents.get(agentId);
        if (!agent) throw new Error(`Agent ${agentId} not found`);

        const messages: ChatMessage[] = [
            { role: 'system', content: agent.instructions },
            { role: 'user', content: prompt },
        ];

        const response = await this.ollamaService.chat(agent.model, messages, {
            temperature: 0.7,
            num_predict: 1024,
        });

        const trace: AgentTrace = {
            id: this.generateTraceId(agentId),
            agentId,
            agentName: agent.name,
            timestamp: new Date(),
            type: 'result',
            content: response.message.content,
            metadata: { model: agent.model, tokens: response.usage?.total_tokens },
        };

        const existingTraces = this.traces.get(agentId) || [];
        existingTraces.push(trace);
        this.traces.set(agentId, existingTraces);
        this.persistTraces();

        return { ...agent, response: response.message.content };
    }

    async evaluateAgent(agentId: string, evaluationPrompt: string): Promise<{ agentId: string; agentName: string; evaluation: string; timestamp: Date }> {
        const agent = this.agents.get(agentId);
        if (!agent) throw new Error(`Agent ${agentId} not found`);

        const messages: ChatMessage[] = [
            { role: 'system', content: `You are an evaluator. Evaluate the agent "${agent.name}".` },
            { role: 'user', content: evaluationPrompt },
        ];

        const response = await this.ollamaService.chat(agent.model, messages, {
            temperature: 0.5,
            num_predict: 512,
        });

        return {
            agentId,
            agentName: agent.name,
            evaluation: response.message.content,
            timestamp: new Date(),
        };
    }

    async debugAgent(agentId: string, debugPrompt: string): Promise<{ agentId: string; agentName: string; debugOutput: string; timestamp: Date }> {
        const agent = this.agents.get(agentId);
        if (!agent) throw new Error(`Agent ${agentId} not found`);

        const messages: ChatMessage[] = [
            { role: 'system', content: `Debug the agent "${agent.name}". Show its thought process and reasoning.` },
            { role: 'user', content: debugPrompt },
        ];

        const response = await this.ollamaService.chat(agent.model, messages, {
            temperature: 0.8,
            num_predict: 2048,
        });

        return {
            agentId,
            agentName: agent.name,
            debugOutput: response.message.content,
            timestamp: new Date(),
        };
    }

    getAgents(): AgentConfig[] {
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

    private persistAgents(): void {
        this.agentStore.save(Array.from(this.agents.values()));
    }

    private persistTraces(): void {
        const allTraces: AgentTrace[] = [];
        for (const traces of this.traces.values()) {
            allTraces.push(...traces);
        }
        this.traceStore.save(allTraces);
    }

    private generateAgentId(name: string): string {
        return `agent_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    }

    private generateTraceId(agentId: string): string {
        return `${agentId}_trace_${Date.now()}`;
    }

    async getCompletionSuggestions(code: string, position: number, language: string): Promise<string[]> {
        try {
            const model = this.configService.defaultModel;
            const context = code.substring(Math.max(0, position - 500), position);
            const prompt = `Provide 5 code completion suggestions for:\n\nContext:\n${context}\n\nCursor position: ${position}\n\nLanguage: ${language}\n\nReturn suggestions as a JSON array.`;
            const response = await this.ollamaService.generate(prompt, model);
            const jsonMatch = response.match(/\[.*\]/s);
            if (jsonMatch) return JSON.parse(jsonMatch[0]);
            return [];
        } catch (error) {
            this.logger.error('Error getting completion suggestions:', error);
            return [];
        }
    }
}
