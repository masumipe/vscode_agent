import * as vscode from 'vscode';
import { OllamaService } from '../services/ollamaService';
import { TerminalService, CommandResult } from '../services/terminalService';
import { DependencyTracer } from '../services/dependencyTracer';
import { ErrorInfo, getUniqueErrorFiles, groupErrorsByFile } from '../services/errorParser';
import { BrowserService } from '../services/browserService';
import { ChangeManager } from '../changes/changeManager';
import { Logger } from '../telemetry/logger';
import { parseErrors } from '../services/errorParser';

export interface LoopProgress {
    iteration: number;
    maxIterations: number;
    step: 'suggesting_command' | 'running_command' | 'analyzing_errors' | 'tracing_dependencies' | 'reading_files' | 'requesting_fix' | 'applying_changes' | 'verifying' | 'done' | 'failed';
    output?: string;
    errors?: ErrorInfo[];
    command?: string;
    message?: string;
}

export interface LoopResult {
    success: boolean;
    iterations: number;
    command: string;
    finalOutput: string;
    errorsFixed: number;
    filesModified: string[];
}

export class AutonomousLoop {
    private ollamaService: OllamaService;
    private terminalService: TerminalService;
    private dependencyTracer: DependencyTracer;
    private errorParser: typeof parseErrors;
    private browserService: BrowserService;
    private changeManager: ChangeManager;
    private logger = Logger.getInstance();
    private progressCallbacks: Array<(progress: LoopProgress) => void> = [];
    private cancelled = false;
    private maxIterations = 10;

    constructor(
        ollamaService: OllamaService,
        terminalService: TerminalService,
        dependencyTracer: DependencyTracer,
        browserService: BrowserService,
        changeManager: ChangeManager,
    ) {
        this.ollamaService = ollamaService;
        this.terminalService = terminalService;
        this.dependencyTracer = dependencyTracer;
        this.errorParser = parseErrors;
        this.browserService = browserService;
        this.changeManager = changeManager;
    }

    onProgress(callback: (progress: LoopProgress) => void): void {
        this.progressCallbacks.push(callback);
    }

    stop(): void {
        this.cancelled = true;
        this.terminalService.cancelRunningProcess();
    }

    private emitProgress(progress: LoopProgress): void {
        for (const cb of this.progressCallbacks) {
            try { cb(progress); } catch { /* ignore */ }
        }
    }

    async run(task: string, initialCommand?: string): Promise<LoopResult> {
        this.cancelled = false;
        let iterations = 0;
        let command = initialCommand || '';
        let finalOutput = '';
        let totalErrorsFixed = 0;
        const allModifiedFiles = new Set<string>();

        if (!command) {
            this.emitProgress({ iteration: 0, maxIterations: this.maxIterations, step: 'suggesting_command' });
            command = await this.suggestCommand(task);
            if (!command || this.cancelled) {
                return this.failure(0, command, 'No command could be determined', [], 0);
            }
        }

        while (iterations < this.maxIterations && !this.cancelled) {
            iterations++;
            this.emitProgress({ iteration: iterations, maxIterations: this.maxIterations, step: 'running_command', command });

            const result = await this.terminalService.executeAndCapture(command);
            finalOutput = result.stdout + '\n' + result.stderr;

            this.emitProgress({ iteration: iterations, maxIterations: this.maxIterations, step: 'analyzing_errors', output: finalOutput, command });

            const errors = this.errorParser(finalOutput, vscode.workspace.workspaceFolders?.[0]?.uri.fsPath);

            const hasErrors = errors.length > 0 || result.exitCode !== 0;

            if (!hasErrors) {
                this.emitProgress({ iteration: iterations, maxIterations: this.maxIterations, step: 'done', message: 'No errors found!' });
                return {
                    success: true,
                    iterations,
                    command,
                    finalOutput,
                    errorsFixed: totalErrorsFixed,
                    filesModified: Array.from(allModifiedFiles),
                };
            }

            this.emitProgress({ iteration: iterations, maxIterations: this.maxIterations, step: 'tracing_dependencies', errors, command });

            const errorFiles = getUniqueErrorFiles(errors);
            const allRelevantFiles = new Set<string>();

            for (const ef of errorFiles) {
                allRelevantFiles.add(ef);
                try {
                    const deps = await this.dependencyTracer.getTransitiveDependencies(ef, 2);
                    for (const d of deps) {
                        allRelevantFiles.add(d);
                    }
                    const dependents = await this.dependencyTracer.getDependents(ef);
                    for (const d of dependents.slice(0, 5)) {
                        allRelevantFiles.add(d);
                    }
                } catch {
                    // continue with partial results
                }
            }

            this.emitProgress({ iteration: iterations, maxIterations: this.maxIterations, step: 'reading_files', errors, command });

            const filesWithContent = new Map<string, string>();
            for (const fp of allRelevantFiles) {
                const content = await this.dependencyTracer.readFileContent(fp);
                if (content !== undefined) {
                    filesWithContent.set(fp, content);
                }
            }

            this.emitProgress({ iteration: iterations, maxIterations: this.maxIterations, step: 'requesting_fix', errors, command });

            const fixResult = await this.requestFix(task, command, finalOutput, errors, filesWithContent);

            if (!fixResult || this.cancelled) {
                break;
            }

            this.emitProgress({ iteration: iterations, maxIterations: this.maxIterations, step: 'applying_changes', command });

            const appliedCount = await this.applyChanges(fixResult);
            if (appliedCount === 0) {
                break;
            }
            totalErrorsFixed += appliedCount;
            for (const change of fixResult) {
                allModifiedFiles.add(change.file);
            }
        }

        if (this.cancelled) {
            return this.failure(iterations, command, 'Cancelled by user', Array.from(allModifiedFiles), totalErrorsFixed);
        }

        this.emitProgress({ iteration: iterations, maxIterations: this.maxIterations, step: 'failed', message: `Reached ${this.maxIterations} iterations without fixing all errors` });
        return this.failure(iterations, command, `Exhausted ${this.maxIterations} iterations`, Array.from(allModifiedFiles), totalErrorsFixed);
    }

    private async suggestCommand(task: string): Promise<string> {
        const prompt = `Given this task: "${task}"

What single shell command should I run to detect errors or verify the fix?
Consider the workspace type and suggest an appropriate build, test, or lint command.

Respond with ONLY the command - no explanation, no markdown, just the command.`;

        try {
            const response = await this.ollamaService.generate(prompt);
            const cmd = response.trim().replace(/^["'`]|["'`]$/g, '');
            return cmd || this.getDefaultCommand();
        } catch {
            return this.getDefaultCommand();
        }
    }

    private async requestFix(
        task: string,
        command: string,
        output: string,
        errors: ErrorInfo[],
        filesWithContent: Map<string, string>,
    ): Promise<{ file: string; content: string }[] | undefined> {
        const fileContext: string[] = [];
        for (const [filePath, content] of filesWithContent) {
            fileContext.push(`=== FILE: ${filePath} ===\n${content}\n=== END FILE ===`);
        }

        const errorContext = errors.map(e =>
            `${e.file ? e.file.fsPath : '<unknown>'}:${e.line} - ${e.message}`
        ).join('\n');

        const prompt = `Task: ${task}
Command run: ${command}
Command output:
${output.substring(0, 3000)}

Errors detected:
${errorContext.substring(0, 2000)}

Relevant files:
${fileContext.join('\n\n').substring(0, 8000)}

Fix the errors. Respond with ONLY a JSON array where each object has:
- "file": the full file path
- "content": the COMPLETE new file content (not just the diff)

Example: [{"file": "/path/to/file.ts", "content": "import ...\\n\\nexport function ..."}]

Do NOT include any text outside the JSON array.`;

        try {
            const response = await this.ollamaService.generate(prompt);
            return this.parseFixResponse(response);
        } catch {
            return undefined;
        }
    }

    private parseFixResponse(response: string): Array<{ file: string; content: string }> | undefined {
        try {
            const jsonStart = response.indexOf('[');
            const jsonEnd = response.lastIndexOf(']');
            if (jsonStart === -1 || jsonEnd === -1) return undefined;
            const json = response.slice(jsonStart, jsonEnd + 1);
            return JSON.parse(json);
        } catch {
            return undefined;
        }
    }

    private async applyChanges(changes: Array<{ file: string; content: string }>): Promise<number> {
        let count = 0;
        for (const change of changes) {
            try {
                const uri = vscode.Uri.file(change.file);
                let originalContent = '';
                try {
                    const bytes = await vscode.workspace.fs.readFile(uri);
                    originalContent = Buffer.from(bytes).toString('utf8');
                } catch {
                    // new file
                }
                const data = Buffer.from(change.content, 'utf8');
                await vscode.workspace.fs.writeFile(uri, data);
                if (originalContent) {
                    this.changeManager.trackWrite(uri, originalContent, change.content);
                }
                count++;
            } catch (err) {
                this.logger.error('Failed to apply change:', err);
            }
        }
        return count;
    }

    private getDefaultCommand(): string {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) return 'echo "No workspace"';
        const root = workspaceFolders[0].uri.fsPath;
        try {
            const fs = require('fs');
            if (fs.existsSync(require('path').join(root, 'package.json'))) return 'npm test';
            if (fs.existsSync(require('path').join(root, 'pyproject.toml')) || fs.existsSync(require('path').join(root, 'setup.py'))) return 'pytest';
            if (fs.existsSync(require('path').join(root, 'tsconfig.json'))) return 'npx tsc --noEmit';
            if (fs.existsSync(require('path').join(root, 'Cargo.toml'))) return 'cargo test';
            if (fs.existsSync(require('path').join(root, 'go.mod'))) return 'go test ./...';
        } catch {
            // ignore
        }
        return 'echo "No default command detected"';
    }

    private failure(iterations: number, command: string, reason: string, filesModified: string[], errorsFixed: number): LoopResult {
        return {
            success: false,
            iterations,
            command,
            finalOutput: reason,
            errorsFixed,
            filesModified,
        };
    }
}
