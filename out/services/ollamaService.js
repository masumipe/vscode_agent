"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaService = void 0;
const axios_1 = __importDefault(require("axios"));
class OllamaService {
    constructor() {
        // Default configuration will be loaded from VS Code settings
        this.client = axios_1.default.create({
            timeout: 60000, // 60 seconds timeout
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
    /**
     * Set the Ollama server URL
     */
    setServerUrl(url) {
        this.client.defaults.baseURL = url;
    }
    /**
     * Health check endpoint
     */
    async healthCheck(url) {
        try {
            const response = await this.client.get('/api/tags');
            return response.data;
        }
        catch (error) {
            throw new Error(`Health check failed: ${error}`);
        }
    }
    /**
     * List available models
     */
    async listModels() {
        try {
            const response = await this.client.get('/api/tags');
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to list models: ${error}`);
        }
    }
    /**
     * Get model information
     */
    async getModelInfo(modelName) {
        try {
            const response = await this.client.post('/api/show', { name: modelName });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to get model info: ${error}`);
        }
    }
    /**
     * Pull a new model
     */
    async pullModel(modelName) {
        try {
            const response = await this.client.post('/api/pull', {
                name: modelName,
                stream: false
            });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to pull model: ${error}`);
        }
    }
    /**
     * Delete a model
     */
    async deleteModel(modelName) {
        try {
            const response = await this.client.post('/api/delete', {
                name: modelName,
                stream: false
            });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to delete model: ${error}`);
        }
    }
    /**
     * Generate a chat response
     */
    async generateChat(model, messages, options) {
        try {
            const response = await this.client.post('/api/chat', {
                model,
                messages,
                ...options
            });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to generate chat: ${error}`);
        }
    }
    /**
     * Generate a completion
     */
    async generateCompletion(model, prompt, options) {
        try {
            const response = await this.client.post('/api/generate', {
                model,
                prompt,
                ...options
            });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to generate completion: ${error}`);
        }
    }
    /**
     * Create a new embedding
     */
    async createEmbedding(model, input) {
        try {
            const response = await this.client.post('/api/embeddings', {
                model,
                input
            });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to create embedding: ${error}`);
        }
    }
    /**
     * Get capabilities of a model
     */
    async getCapabilities(model) {
        try {
            const response = await this.client.post('/api/show', { name: model });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to get model capabilities: ${error}`);
        }
    }
}
exports.OllamaService = OllamaService;
//# sourceMappingURL=ollamaService.js.map