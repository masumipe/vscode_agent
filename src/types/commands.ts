export const Commands = {
    // Agent commands
    AgentCreate: 'ollama.agent.create',
    AgentRun: 'ollama.agent.run',
    AgentEvaluate: 'ollama.agent.evaluate',
    AgentDebug: 'ollama.agent.debug',
    NewAgent: 'ollama.newAgent',

    // Chat commands
    Chat: 'ollama.chat',
    ChatSend: 'ollama.chat.send',
    ChatClosePanel: 'ollama.chat.closePanel',

    // Code action commands
    GenerateCode: 'ollama.generateCode',
    DebugCode: 'ollama.debugCode',
    ExplainCode: 'ollama.explainCode',
    Refactor: 'ollama.refactor',
    WriteTests: 'ollama.writeTests',
    GenerateDocs: 'ollama.generateDocs',

    // Completion
    AcceptCompletion: 'ollama.acceptCompletion',

    // Status
    AgentStatus: 'ollama.agent.status',
} as const;

export type Command = (typeof Commands)[keyof typeof Commands];
