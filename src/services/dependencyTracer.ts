import * as vscode from 'vscode';
import * as path from 'path';
import { extractImports, getParserForFile } from './languageParser';
import { Logger } from '../telemetry/logger';

export interface DependencyInfo {
    filePath: string;
    imports: string[];
    importedBy: string[];
}

export class DependencyTracer {
    private logger = Logger.getInstance();
    private workspaceRoots: string[];

    constructor() {
        this.workspaceRoots = vscode.workspace.workspaceFolders
            ?.map(f => f.uri.fsPath) || [];
    }

    async getDependencies(filePath: string): Promise<string[]> {
        try {
            const imports = extractImports(filePath);
            return imports.filter(p => p !== filePath);
        } catch {
            return [];
        }
    }

    async getTransitiveDependencies(filePath: string, maxDepth: number = 3): Promise<string[]> {
        const visited = new Set<string>();
        const result: string[] = [];
        await this.walkDependencies(filePath, visited, result, 0, maxDepth);
        return result.filter(p => p !== filePath);
    }

    private async walkDependencies(
        filePath: string,
        visited: Set<string>,
        result: string[],
        depth: number,
        maxDepth: number,
    ): Promise<void> {
        if (depth > maxDepth || visited.has(filePath)) return;
        visited.add(filePath);
        if (depth > 0) result.push(filePath);

        const deps = await this.getDependencies(filePath);
        for (const dep of deps) {
            await this.walkDependencies(dep, visited, result, depth + 1, maxDepth);
        }
    }

    async getDependents(filePath: string): Promise<string[]> {
        const dependents: string[] = [];
        const allFiles = await this.getWorkspaceFiles();

        for (const file of allFiles) {
            if (file === filePath) continue;
            try {
                const deps = await this.getDependencies(file);
                if (deps.includes(filePath)) {
                    dependents.push(file);
                }
            } catch {
                // skip unreadable files
            }
        }
        return dependents;
    }

    async getDependencyChain(filePath: string): Promise<{ file: string; imports: string[] }[]> {
        const chain: { file: string; imports: string[] }[] = [];
        const visited = new Set<string>();
        await this.buildChain(filePath, visited, chain, 0, 5);
        return chain;
    }

    private async buildChain(
        filePath: string,
        visited: Set<string>,
        chain: { file: string; imports: string[] }[],
        depth: number,
        maxDepth: number,
    ): Promise<void> {
        if (depth > maxDepth || visited.has(filePath)) return;
        visited.add(filePath);

        const deps = await this.getDependencies(filePath);
        chain.push({ file: filePath, imports: deps });

        for (const dep of deps) {
            await this.buildChain(dep, visited, chain, depth + 1, maxDepth);
        }
    }

    async getWorkspaceFiles(): Promise<string[]> {
        const files: string[] = [];
        for (const root of this.workspaceRoots) {
            try {
                const pattern = new vscode.RelativePattern(
                    vscode.Uri.file(root),
                    '**/*.{ts,tsx,js,jsx,mjs,cjs,py,cs,go,rs,java,c,cpp,h,hpp}',
                );
                const uris = await vscode.workspace.findFiles(pattern, '**/node_modules/**');
                for (const uri of uris) {
                    files.push(uri.fsPath);
                }
            } catch {
                // skip if workspace API fails
            }
        }
        return files;
    }

    async readFileContent(filePath: string): Promise<string | undefined> {
        try {
            const uri = vscode.Uri.file(filePath);
            const bytes = await vscode.workspace.fs.readFile(uri);
            return Buffer.from(bytes).toString('utf8');
        } catch {
            return undefined;
        }
    }

    async readFilesWithContent(filePaths: string[]): Promise<Map<string, string>> {
        const result = new Map<string, string>();
        for (const fp of filePaths) {
            const content = await this.readFileContent(fp);
            if (content !== undefined) {
                result.set(fp, content);
            }
        }
        return result;
    }
}
