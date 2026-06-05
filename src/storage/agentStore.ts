import * as fs from 'fs';
import * as path from 'path';
import { AgentConfig } from '../types';
import { Logger } from '../telemetry/logger';

export class AgentStore {
    private filePath: string;
    private logger = Logger.getInstance();

    constructor(storageDir: string) {
        this.filePath = path.join(storageDir, 'agents.json');
    }

    load(): AgentConfig[] {
        try {
            if (!fs.existsSync(this.filePath)) return [];
            const data = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
            return (data.agents || []).map((a: Record<string, unknown>) => ({
                ...a,
                createdAt: new Date(a.createdAt as string),
                updatedAt: new Date(a.updatedAt as string),
            })) as AgentConfig[];
        } catch (error) {
            this.logger.error('Failed to load agents:', error);
            return [];
        }
    }

    save(agents: AgentConfig[]): void {
        try {
            fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
            fs.writeFileSync(this.filePath, JSON.stringify({ agents }, null, 2));
        } catch (error) {
            this.logger.error('Failed to save agents:', error);
        }
    }
}
