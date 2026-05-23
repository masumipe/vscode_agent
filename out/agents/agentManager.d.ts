import { OllamaService } from '../services/ollamaService';
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
export declare class AgentManager {
    private agents;
    private traces;
    private ollamaService;
    private configPath;
    constructor(ollamaService: OllamaService);
    /**
     * Create a new agent
     */
    createAgent(name: string): Promise<Agent>;
    /**
     * Load an existing agent
     */
    loadAgent(agentId: string): Promise<Agent | undefined>;
    /**
     * Load agent from configuration file
     */
    loadAgentConfiguration(configPath: string): Promise<void>;
    /**
     * Run an agent
     */
    runAgent(agentId: string, prompt: string): Promise<any>;
    /**
     * Evaluate an agent
     */
    evaluateAgent(agentId: string, evaluationPrompt: string): Promise<any>;
    /**
     * Debug an agent
     */
    debugAgent(agentId: string, debugPrompt: string): Promise<any>;
    /**
     * Get all agents
     */
    getAgents(): Agent[];
    /**
     * Get traces for an agent
     */
    getTraces(agentId: string): AgentTrace[];
    /**
     * Get all traces
     */
    getAllTraces(): AgentTrace[];
    /**
     * Save agents to file
     */
    private saveAgents;
    /**
     * Generate unique agent ID
     */
    private generateAgentId;
    /**
     * Generate unique trace ID
     */
    private generateTraceId;
    /**
     * Get completion suggestions for code
     */
    getCompletionSuggestions(code: string, position: number, language: string): Promise<string[]>;
    /**
     * Get Ollama client
     */
    private getOllamaClient;
}
