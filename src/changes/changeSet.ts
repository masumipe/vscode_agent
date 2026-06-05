import * as vscode from 'vscode';

export interface ChangedRange {
    startLine: number;
    endLine: number;
    originalText: string;
    modifiedText: string;
}

export interface ChangeEntry {
    uri: vscode.Uri;
    timestamp: number;
    originalContent: string;
    currentContent: string;
    ranges: ChangedRange[];
    accepted: boolean;
    rejected: boolean;
}

export function computeDiff(uri: vscode.Uri, original: string, modified: string): ChangedRange[] {
    const ranges: ChangedRange[] = [];
    const origLines = original.split('\n');
    const modLines = modified.split('\n');
    const maxLen = Math.max(origLines.length, modLines.length);

    let startLine = -1;
    for (let i = 0; i < maxLen; i++) {
        const origLine = origLines[i] ?? '';
        const modLine = modLines[i] ?? '';
        if (origLine !== modLine) {
            if (startLine === -1) startLine = i;
        } else {
            if (startLine !== -1) {
                ranges.push({
                    startLine,
                    endLine: i - 1,
                    originalText: origLines.slice(startLine, i).join('\n'),
                    modifiedText: modLines.slice(startLine, i).join('\n'),
                });
                startLine = -1;
            }
        }
    }
    if (startLine !== -1) {
        ranges.push({
            startLine,
            endLine: maxLen - 1,
            originalText: origLines.slice(startLine).join('\n'),
            modifiedText: modLines.slice(startLine).join('\n'),
        });
    }
    return ranges;
}
