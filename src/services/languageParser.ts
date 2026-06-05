import * as path from 'path';
import * as fs from 'fs';

export interface LanguageParser {
    languageIds: string[];
    extractImports(content: string, filePath: string): string[];
}

const tsJsParser: LanguageParser = {
    languageIds: ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'],
    extractImports(content: string, filePath: string): string[] {
        const imports: string[] = [];
        const patterns = [
            /import\s+[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g,
            /import\s+['"]([^'"]+)['"]/g,
            /const\s+\w+\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
            /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
        ];
        for (const pattern of patterns) {
            let match: RegExpExecArray | null;
            while ((match = pattern.exec(content)) !== null) {
                imports.push(match[1]);
            }
        }
        return resolveImports(imports, filePath);
    },
};

const pythonParser: LanguageParser = {
    languageIds: ['python'],
    extractImports(content: string, filePath: string): string[] {
        const imports: string[] = [];
        const patterns = [
            /from\s+(\S+)\s+import/g,
            /import\s+(\S+)/g,
        ];
        for (const pattern of patterns) {
            let match: RegExpExecArray | null;
            while ((match = pattern.exec(content)) !== null) {
                imports.push(match[1]);
            }
        }
        return resolvePythonImports(imports, filePath);
    },
};

const csharpParser: LanguageParser = {
    languageIds: ['csharp'],
    extractImports(content: string, filePath: string): string[] {
        const imports: string[] = [];
        const pattern = /using\s+([^;]+);/g;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(content)) !== null) {
            imports.push(match[1]);
        }
        return resolveImports(imports, filePath);
    },
};

const goParser: LanguageParser = {
    languageIds: ['go'],
    extractImports(content: string, filePath: string): string[] {
        const imports: string[] = [];
        const singlePattern = /import\s+['"]([^'"]+)['"]/g;
        let match: RegExpExecArray | null;
        while ((match = singlePattern.exec(content)) !== null) {
            imports.push(match[1]);
        }
        const blockPattern = /import\s*\(([\s\S]*?)\)/g;
        while ((match = blockPattern.exec(content)) !== null) {
            const block = match[1];
            const linePattern = /['"]([^'"]+)['"]/g;
            let lm: RegExpExecArray | null;
            while ((lm = linePattern.exec(block)) !== null) {
                imports.push(lm[1]);
            }
        }
        return resolveImports(imports, filePath);
    },
};

const rustParser: LanguageParser = {
    languageIds: ['rust'],
    extractImports(content: string, filePath: string): string[] {
        const imports: string[] = [];
        const pattern = /use\s+([^;]+);/g;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(content)) !== null) {
            imports.push(match[1]);
        }
        return resolveImports(imports, filePath);
    },
};

const cFamilyParser: LanguageParser = {
    languageIds: ['c', 'cpp', 'c', 'h', 'hpp'],
    extractImports(content: string, filePath: string): string[] {
        const imports: string[] = [];
        const pattern = /#include\s+[<"]([^>"]+)[>"]/g;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(content)) !== null) {
            imports.push(match[1]);
        }
        return resolveImports(imports, filePath);
    },
};

const javaParser: LanguageParser = {
    languageIds: ['java'],
    extractImports(content: string, filePath: string): string[] {
        const imports: string[] = [];
        const pattern = /import\s+([^;]+);/g;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(content)) !== null) {
            imports.push(match[1]);
        }
        return resolveImports(imports, filePath);
    },
};

const allParsers: LanguageParser[] = [
    tsJsParser, pythonParser, csharpParser, goParser, rustParser, cFamilyParser, javaParser,
];

export function getParserForFile(filePath: string): LanguageParser | undefined {
    const ext = path.extname(filePath).toLowerCase();
    const langMap: Record<string, string> = {
        '.ts': 'typescript',
        '.tsx': 'typescriptreact',
        '.js': 'javascript',
        '.jsx': 'javascriptreact',
        '.mjs': 'javascript',
        '.cjs': 'javascript',
        '.py': 'python',
        '.cs': 'csharp',
        '.go': 'go',
        '.rs': 'rust',
        '.c': 'c',
        '.cpp': 'cpp',
        '.h': 'h',
        '.hpp': 'hpp',
        '.java': 'java',
    };
    const langId = langMap[ext];
    if (!langId) return undefined;
    return allParsers.find(p => p.languageIds.includes(langId));
}

export function extractImports(filePath: string, content?: string): string[] {
    const parser = getParserForFile(filePath);
    if (!parser) return [];
    const source = content || (fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '');
    if (!source) return [];
    return parser.extractImports(source, filePath);
}

function resolveImports(imports: string[], filePath: string): string[] {
    const dir = path.dirname(filePath);
    const resolved: string[] = [];
    for (const imp of imports) {
        if (imp.startsWith('.')) {
            const resolvedPath = path.resolve(dir, imp);
            const withExt = tryResolveExtension(resolvedPath);
            if (withExt) resolved.push(withExt);
        } else if (!imp.includes(' ') && !imp.includes('\n')) {
            const resolvedPath = path.resolve(dir, imp);
            const withExt = tryResolveExtension(resolvedPath);
            if (withExt) resolved.push(withExt);
        }
    }
    return resolved;
}

function resolvePythonImports(imports: string[], filePath: string): string[] {
    const dir = path.dirname(filePath);
    const resolved: string[] = [];
    for (const imp of imports) {
        const modulePath = imp.replace(/\./g, '/');
        const absPath = path.resolve(dir, modulePath);
        const withExt = tryResolvePythonPath(absPath);
        if (withExt) resolved.push(withExt);
    }
    return resolved;
}

function tryResolveExtension(basePath: string): string | undefined {
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.node'];
    for (const ext of extensions) {
        const p = `${basePath}${ext}`;
        if (fs.existsSync(p)) return p;
    }
    if (fs.existsSync(basePath) && fs.statSync(basePath).isFile()) return basePath;
    const index = path.join(basePath, 'index.ts');
    if (fs.existsSync(index)) return index;
    const indexJs = path.join(basePath, 'index.js');
    if (fs.existsSync(indexJs)) return indexJs;
    return undefined;
}

function tryResolvePythonPath(basePath: string): string | undefined {
    const extensions = ['.py', '.pyi', '.so', '.pyd'];
    for (const ext of extensions) {
        const p = `${basePath}${ext}`;
        if (fs.existsSync(p)) return p;
    }
    if (fs.existsSync(basePath) && fs.statSync(basePath).isFile()) return basePath;
    const init = path.join(basePath, '__init__.py');
    if (fs.existsSync(init)) return init;
    return undefined;
}
