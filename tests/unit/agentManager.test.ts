import * as assert from 'assert';
import { AgentManager } from '../../src/agents/agentManager';
import { OllamaService } from '../../src/services/ollamaService';

describe('AgentManager', () => {
    let agentManager: AgentManager;

    beforeEach(() => {
        const mockService = new OllamaService();
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

    it('should create an agent with name and description', async () => {
        const agent = await agentManager.createAgent('test-agent', 'A test agent');
        assert.strictEqual(agent.name, 'test-agent');
        assert.ok(agent.id.startsWith('agent_'));
    });

    it('should return all created agents', async () => {
        await agentManager.createAgent('agent-1');
        await agentManager.createAgent('agent-2');
        const agents = agentManager.getAgents();
        assert.strictEqual(agents.length, 2);
    });
});
