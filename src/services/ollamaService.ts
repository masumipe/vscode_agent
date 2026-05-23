import axios, { AxiosInstance } from 'axios';

export class OllamaService {
    private client: AxiosInstance;

    constructor() {
        // Default configuration will be loaded from VS Code settings
        this.client = axios.create({
            timeout: 60000, // 60 seconds timeout
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Set the Ollama server URL
     */
    setServerUrl(url: string): void {
        this.client.defaults.baseURL = url;
    }

    /**
     * Health check endpoint
     */
    async healthCheck(url: string): Promise<any> {
        try {
            const response = await this.client.get('/api/tags');
            return response.data;
        } catch (error) {
            throw new Error(`Health check failed: ${error}`);
        }
    }

    /**
     * List available models
     */
    async listModels(): Promise<any> {
        try {
            const response = await this.client.get('/api/tags');
            return response.data;
        } catch (error) {
            throw new Error(`Failed to list models: ${error}`);
        }
    }

    /**
     * Get model information
     */
    async getModelInfo(modelName: string): Promise<any> {
        try {
            const response = await this.client.post('/api/show', { name: modelName });
            return response.data;
        } catch (error) {
            throw new Error(`Failed to get model info: ${error}`);
        }
    }

    /**
     * Pull a new model
     */
    async pullModel(modelName: string): Promise<any> {
        try {
            const response = await this.client.post('/api/pull', {
                name: modelName,
                stream: false
            });
            return response.data;
        } catch (error) {
            throw new Error(`Failed to pull model: ${error}`);
        }
    }

    /**
     * Delete a model
     */
    async deleteModel(modelName: string): Promise<any> {
        try {
            const response = await this.client.post('/api/delete', {
                name: modelName,
                stream: false
            });
            return response.data;
        } catch (error) {
            throw new Error(`Failed to delete model: ${error}`);
        }
    }

    /**
     * Generate a chat response
     */
    async generateChat(
        model: string,
        messages: Array<{ role: string; content: string }>,
        options?: {
            temperature?: number;
            top_p?: number;
            top_k?: number;
            num_predict?: number;
        }
    ): Promise<any> {
        try {
            const response = await this.client.post('/api/chat', {
                model,
                messages,
                ...options
            });
            return response.data;
        } catch (error) {
            throw new Error(`Failed to generate chat: ${error}`);
        }
    }

    /**
     * Generate a completion
     */
    async generateCompletion(
        model: string,
        prompt: string,
        options?: {
            temperature?: number;
            top_p?: number;
            top_k?: number;
            num_predict?: number;
        }
    ): Promise<any> {
        try {
            const response = await this.client.post('/api/generate', {
                model,
                prompt,
                ...options
            });
            return response.data;
        } catch (error) {
            throw new Error(`Failed to generate completion: ${error}`);
        }
    }

    /**
     * Create a new embedding
     */
    async createEmbedding(model: string, input: string): Promise<any> {
        try {
            const response = await this.client.post('/api/embeddings', {
                model,
                input
            });
            return response.data;
        } catch (error) {
            throw new Error(`Failed to create embedding: ${error}`);
        }
    }

    /**
     * Get capabilities of a model
     */
    async getCapabilities(model: string): Promise<any> {
        try {
            const response = await this.client.post('/api/show', { name: model });
            return response.data;
        } catch (error) {
            throw new Error(`Failed to get model capabilities: ${error}`);
        }
    }
}
