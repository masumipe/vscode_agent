import * as vscode from 'vscode';

export interface ErrorInfo {
    file: vscode.Uri | undefined;
    line: number;
    column?: number;
    message: string;
    type: 'compile' | 'runtime' | 'lint' | 'test' | 'unknown';
}

export function parseErrors(output: string, workspaceRoot?: string): ErrorInfo[] {
    const errors: ErrorInfo[] = [];
    const lines = output.split('\n');
    const workspacePath = workspaceRoot || '';

    for (const line of lines) {
        const parsed = tryParseTypeScriptError(line, workspacePath)
            || tryParseNodeStackTrace(line, workspacePath)
            || tryParsePythonTraceback(line, workspacePath)
            || tryParseGenericFileError(line, workspacePath)
            || tryParseTestFailure(line, workspacePath);
        if (parsed) {
            errors.push(parsed);
        }
    }

    return errors;
}

export function parseErrorsFromString(output: string, workspaceRoot?: string): ErrorInfo[] {
    return parseErrors(output, workspaceRoot);
}

function tryParseTypeScriptError(line: string, workspaceRoot: string): ErrorInfo | undefined {
    const tsPattern = /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+(.+)$/;
    const match = tsPattern.exec(line.trim());
    if (!match) return undefined;

    const filePath = resolveFilePath(match[1], workspaceRoot);
    return {
        file: filePath ? vscode.Uri.file(filePath) : undefined,
        line: parseInt(match[2], 10) - 1,
        column: parseInt(match[3], 10) - 1,
        message: match[5].trim(),
        type: 'compile',
    };
}

function tryParseNodeStackTrace(line: string, workspaceRoot: string): ErrorInfo | undefined {
    const nodePattern = /^\s+at\s+(?:(.+?)\s+\()?(.+?):(\d+)(?::(\d+))?\)?$/;
    const match = nodePattern.exec(line.trim());
    if (!match) return undefined;

    const filePath = resolveFilePath(match[2], workspaceRoot);
    if (!filePath) return undefined;

    return {
        file: vscode.Uri.file(filePath),
        line: parseInt(match[3], 10) - 1,
        column: match[4] ? parseInt(match[4], 10) - 1 : undefined,
        message: match[1] ? `at ${match[1]}` : 'at <anonymous>',
        type: 'runtime',
    };
}

function tryParsePythonTraceback(line: string, workspaceRoot: string): ErrorInfo | undefined {
    const pyPattern = /^\s*File\s+"([^"]+)",\s+line\s+(\d+)/;
    const match = pyPattern.exec(line.trim());
    if (!match) return undefined;

    const filePath = resolveFilePath(match[1], workspaceRoot);
    if (!filePath) return undefined;

    return {
        file: vscode.Uri.file(filePath),
        line: parseInt(match[2], 10) - 1,
        type: 'runtime',
        message: line.trim(),
    };
}

function tryParseGenericFileError(line: string, workspaceRoot: string): ErrorInfo | undefined {
    const genericPattern = /^(.+?):(\d+):(\d+)?\s*(?::\s*)?(error|warning|Error|Warning)?\s*(.+)?$/;
    const match = genericPattern.exec(line.trim());
    if (!match) return undefined;

    const filePath = resolveFilePath(match[1], workspaceRoot);
    if (!filePath) return undefined;

    return {
        file: vscode.Uri.file(filePath),
        line: parseInt(match[2], 10) - 1,
        column: match[3] ? parseInt(match[3], 10) - 1 : undefined,
        message: match[5]?.trim() || line.trim(),
        type: match[4]?.toLowerCase().includes('error') ? 'compile' : 'unknown',
    };
}

function tryParseTestFailure(line: string, workspaceRoot: string): ErrorInfo | undefined {
    const testPatterns = [
        /^\s*(?:\d+)\s+(?:passing|failing|pending)/,
        /^\s*(?:AssertionError|AssertionError)\s*:/,
        /^\s*(?:Expected|expected)\s+.*\s+(?:to|not)/i,
        /FAIL\s+(.+?)\s+\(/,
    ];

    for (const pattern of testPatterns) {
        if (pattern.test(line.trim())) {
            return {
                file: undefined,
                line: 0,
                message: line.trim(),
                type: 'test',
            };
        }
    }

    return undefined;
}

function resolveFilePath(rawPath: string, workspaceRoot: string): string | undefined {
    let normalized = rawPath.trim();

    if (normalized.startsWith('file://')) {
        try {
            return vscode.Uri.parse(normalized).fsPath;
        } catch {
            normalized = normalized.replace(/^file:\/\//, '');
        }
    }

    if (normalized.startsWith('/') || /^[A-Za-z]:[/\\]/.test(normalized)) {
        return normalized;
    }

    if (workspaceRoot) {
        const joined = require('path').join(workspaceRoot, normalized);
        if (require('fs').existsSync(joined)) return joined;
    }

    return undefined;
}

export function groupErrorsByFile(errors: ErrorInfo[]): Map<string, ErrorInfo[]> {
    const grouped = new Map<string, ErrorInfo[]>();
    for (const error of errors) {
        const key = error.file?.fsPath || '__no_file__';
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(error);
    }
    return grouped;
}

export function getUniqueErrorFiles(errors: ErrorInfo[]): string[] {
    const files = new Set<string>();
    for (const error of errors) {
        if (error.file) files.add(error.file.fsPath);
    }
    return Array.from(files);
}
