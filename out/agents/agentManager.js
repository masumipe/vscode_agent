"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentManager = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class AgentManager {
    constructor(ollamaService) {
        this.agents = new Map();
        this.traces = new Map();
        this.ollamaService = ollamaService;
        this.configPath = path.join(process.env.VSCODE_USER_DATA || '', 'Code - Insiders/User/globalStorage/vscode-ollama-agent', 'agents.json');
    }
    /**
     * Create a new agent
     */
    async createAgent(name) {
        const agentId = this.generateAgentId(name);
        const agent = {
            id: agentId,
            name,
            description: `Agent ${name} created at ${new Date().toISOString()}`,
            model: vscode.workspace.getConfiguration('ollama').get('defaultModel', 'llama3.2'),
            instructions: 'You are a helpful AI assistant.',
            capabilities: ['chat', 'reasoning'],
            createdAt: new Date(),
            updatedAt: new Date(),
            configuration: {}
        };
        this.agents.set(agentId, agent);
        await this.saveAgents();
        return agent;
    }
    /**
     * Load an existing agent
     */
    async loadAgent(agentId) {
        return this.agents.get(agentId);
    }
    /**
     * Load agent from configuration file
     */
    async loadAgentConfiguration(configPath) {
        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            // Update existing agent or create new one
            const agentId = config.id || this.generateAgentId(config.name);
            const agent = {
                id: agentId,
                name: config.name,
                description: config.description || '',
                model: config.model || 'llama3.2',
                instructions: config.instructions || 'You are a helpful AI assistant.',
                capabilities: config.capabilities || ['chat', 'reasoning'],
                createdAt: config.createdAt || new Date(),
                updatedAt: new Date(),
                configuration: config.configuration || {}
            };
            this.agents.set(agentId, agent);
            await this.saveAgents();
        }
        catch (error) {
            console.error('Failed to load agent configuration:', error);
        }
    }
    /**
     * Run an agent
     */
    async runAgent(agentId, prompt) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
        }
        const messages = [
            { role: 'system', content: agent.instructions },
            { role: 'user', content: prompt }
        ];
        try {
            const response = await this.ollamaService.generateChat(agent.model, messages, {
                temperature: 0.7,
                num_predict: 1024
            });
            // Create trace
            const trace = {
                id: this.generateTraceId(agentId),
                agentId,
                agentName: agent.name,
                timestamp: new Date(),
                type: 'result',
                content: response.message?.content || response.response,
                metadata: {
                    model: agent.model,
                    tokens: response.usage?.total_tokens
                }
            };
            const existingTraces = this.traces.get(agentId) || [];
            existingTraces.push(trace);
            this.traces.set(agentId, existingTraces);
            return response;
        }
        catch (error) {
            console.error(`Error running agent ${agentId}:`, error);
            throw error;
        }
    }
    /**
     * Evaluate an agent
     */
    async evaluateAgent(agentId, evaluationPrompt) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
        }
        const messages = [
            { role: 'system', content: `You are an evaluator. Evaluate the agent "${agent.name}".` },
            { role: 'user', content: evaluationPrompt }
        ];
        try {
            const response = await this.ollamaService.generateChat(agent.model, messages, {
                temperature: 0.5,
                num_predict: 512
            });
            return {
                agentId,
                agentName: agent.name,
                evaluation: response.message?.content || response.response,
                timestamp: new Date()
            };
        }
        catch (error) {
            console.error(`Error evaluating agent ${agentId}:`, error);
            throw error;
        }
    }
    /**
     * Debug an agent
     */
    async debugAgent(agentId, debugPrompt) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
        }
        const messages = [
            { role: 'system', content: `Debug the agent "${agent.name}". Show its thought process and reasoning.` },
            { role: 'user', content: debugPrompt }
        ];
        try {
            const response = await this.ollamaService.generateChat(agent.model, messages, {
                temperature: 0.8,
                num_predict: 2048
            });
            return {
                agentId,
                agentName: agent.name,
                debugOutput: response.message?.content || response.response,
                timestamp: new Date()
            };
        }
        catch (error) {
            console.error(`Error debugging agent ${agentId}:`, error);
            throw error;
        }
    }
    /**
     * Get all agents
     */
    getAgents() {
        return Array.from(this.agents.values());
    }
    /**
     * Get traces for an agent
     */
    getTraces(agentId) {
        return this.traces.get(agentId) || [];
    }
    /**
     * Get all traces
     */
    getAllTraces() {
        const allTraces = [];
        for (const [agentId, traces] of this.traces.entries()) {
            allTraces.push(...traces);
        }
        return allTraces;
    }
    /**
     * Save agents to file
     */
    async saveAgents() {
        const agentsData = {
            agents: Array.from(this.agents.values()),
            traces: Array.from(this.traces.entries()).map(([agentId, traces]) => ({
                agentId,
                traces
            }))
        };
        try {
            fs.mkdirSync(path.dirname(this.configPath), { recursive: true });
            fs.writeFileSync(this.configPath, JSON.stringify(agentsData, null, 2));
        }
        catch (error) {
            console.error('Failed to save agents:', error);
        }
    }
    /**
     * Generate unique agent ID
     */
    generateAgentId(name) {
        return `agent_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    }
    /**
     * Generate unique trace ID
     */
    generateTraceId(agentId) {
        return `${agentId}_trace_${Date.now()}`;
    }
    /**
     * Get completion suggestions for code
     */
    async getCompletionSuggestions(code, position, language) {
        try {
            const serverUrl = vscode.workspace.getConfiguration('ollama').get('serverUrl', 'http://localhost:11434');
            const model = vscode.workspace.getConfiguration('ollama').get('defaultModel', 'llama3.2');
            const client = await this.getOllamaClient(serverUrl);
            const context = code.substring(Math.max(0, position - 500), position);
            const prompt = `Provide 5 code completion suggestions for:\n\nContext:\n${context}\n\nCursor position: ${position}\n\nLanguage: ${language}\n\nReturn suggestions as a JSON array.`;
            const response = await client.post('/api/generate', {
                model,
                prompt,
                stream: false,
                options: {
                    temperature: 0.3,
                    num_predict: 200
                }
            });
            // Parse JSON response
            const jsonMatch = response.response?.match(/\[.*\]/s);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return [];
        }
        catch (error) {
            console.error('Error getting completion suggestions:', error);
            return [];
        }
    }
    /**
     * Get Ollama client
     */
    async getOllamaClient(url) {
        const axios = await Promise.resolve().then(() => __importStar(require('axios')));
        return axios.create({
            baseURL: url,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}
exports.AgentManager = AgentManager;
//# sourceMappingURL=agentManager.js.map