export declare class OllamaService {
    private client;
    constructor();
    /**
     * Set the Ollama server URL
     */
    setServerUrl(url: string): void;
    /**
     * Health check endpoint
     */
    healthCheck(url: string): Promise<any>;
    /**
     * List available models
     */
    listModels(): Promise<any>;
    /**
     * Get model information
     */
    getModelInfo(modelName: string): Promise<any>;
    /**
     * Pull a new model
     */
    pullModel(modelName: string): Promise<any>;
    /**
     * Delete a model
     */
    deleteModel(modelName: string): Promise<any>;
    /**
     * Generate a chat response
     */
    generateChat(model: string, messages: Array<{
        role: string;
        content: string;
    }>, options?: {
        temperature?: number;
        top_p?: number;
        top_k?: number;
        num_predict?: number;
    }): Promise<any>;
    /**
     * Generate a completion
     */
    generateCompletion(model: string, prompt: string, options?: {
        temperature?: number;
        top_p?: number;
        top_k?: number;
        num_predict?: number;
    }): Promise<any>;
    /**
     * Create a new embedding
     */
    createEmbedding(model: string, input: string): Promise<any>;
    /**
     * Get capabilities of a model
     */
    getCapabilities(model: string): Promise<any>;
}
