export type WebviewCommand =
    | 'generate'
    | 'sendMessage'
    | 'readFile'
    | 'writeFile'
    | 'deleteFile'
    | 'readDir'
    | 'runCommand'
    | 'sendToTerminal'
    | 'openFile'
    | 'fetchUrl'
    | 'closePanel'
    | 'acceptChange'
    | 'rejectChange'
    | 'openFileRequest'
    | 'fixTask'
    | 'stopLoop';

export type WebviewResponseType =
    | 'config'
    | 'result'
    | 'error'
    | 'readFileResponse'
    | 'writeFileResponse'
    | 'deleteFileResponse'
    | 'readDirResponse'
    | 'runCommandResponse'
    | 'sendToTerminalResponse'
    | 'openFileResponse'
    | 'fetchUrlResponse'
    | 'changeNotification'
    | 'loopProgress'
    | 'loopComplete';

export interface WebviewRequest {
    command: WebviewCommand;
    text?: string;
    message?: string;
    messages?: Array<{ role: string; content: string }>;
    model?: string;
    path?: string;
    content?: string;
    recursive?: boolean;
    useTrash?: boolean;
    cmd?: string;
    cwd?: string;
    show?: boolean;
    terminalName?: string;
    url?: string;

    // loop fields
    task?: string;
    initialCommand?: string;
}

export interface WebviewResponse {
    type: WebviewResponseType;
    serverUrl?: string;
    defaultModel?: string;
    text?: string;
    message?: string;
    path?: string;
    content?: string;
    success?: boolean;
    entries?: Array<[string, number]>;
    stdout?: string;
    stderr?: string;
    error?: string | null;
    cmd?: string;
    terminal?: string;
    url?: string;
    body?: string;

    // change notification fields
    filePath?: string;
    fileName?: string;
    linesChanged?: number;
    blocks?: number;
    changeIndex?: number;

    // loop progress fields
    iteration?: number;
    maxIterations?: number;
    step?: string;
    command?: string;
    output?: string;
    iterationsUsed?: number;
    errorsFixed?: number;
    filesModified?: string[];
    summary?: string;
}
