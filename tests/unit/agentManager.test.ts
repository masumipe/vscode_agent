import * as assert from 'assert';
import { AgentManager } from '../../src/agents/agentManager';
import { OllamaService } from '../../src/services/ollamaService';

describe('AgentManager', () => {
    let agentManager: AgentManager;
    let mockService: OllamaService;

    beforeEach(() => {
        mockService = new OllamaService();
        agentManager = new AgentManager(mockService);
    });

    it('should create an instance', () => {
        assert.ok(agentManager);
    });

    it('should have a createAgent method', () => {
        assert.ok(typeof agentManager.createAgent === 'function');
    });

    it('should have a runAgent method', () => {
        assert.ok(typeof agentManager.runAgent === 'function');
    });

    it('should have an evaluateAgent method', () => {
        assert.ok(typeof agentManager.evaluateAgent === 'function');
    });

    it('should have a debugAgent method', () => {
        assert.ok(typeof agentManager.debugAgent === 'function');
    });
});
