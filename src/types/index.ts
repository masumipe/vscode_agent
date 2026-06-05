export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface ChatOptions {
    temperature?: number;
    num_predict?: number;
}

export interface ChatResponse {
    message: { content: string };
    response: string;
    usage?: { total_tokens: number };
}

export interface AgentConfig {
    id: string;
    name: string;
    description: string;
    model: string;
    instructions: string;
    capabilities: string[];
    createdAt: Date;
    updatedAt: Date;
    configuration: Record<string, unknown>;
}

export interface AgentTrace {
    id: string;
    agentId: string;
    agentName: string;
    timestamp: Date;
    type: 'thought' | 'action' | 'observation' | 'result';
    content: string;
    metadata: Record<string, unknown>;
}

export type CodeAction =
    | 'generateCode'
    | 'debugCode'
    | 'explainCode'
    | 'refactor'
    | 'writeTests'
    | 'generateDocs';
