import * as fs from 'fs';
import * as path from 'path';
import { AgentTrace } from '../types';
import { Logger } from '../telemetry/logger';

export class TraceStore {
    private filePath: string;
    private logger = Logger.getInstance();

    constructor(storageDir: string) {
        this.filePath = path.join(storageDir, 'traces.json');
    }

    load(): AgentTrace[] {
        try {
            if (!fs.existsSync(this.filePath)) return [];
            const data = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
            return (data.traces || []).map((t: Record<string, unknown>) => ({
                ...t,
                timestamp: new Date(t.timestamp as string),
            })) as AgentTrace[];
        } catch (error) {
            this.logger.error('Failed to load traces:', error);
            return [];
        }
    }

    save(traces: AgentTrace[]): void {
        try {
            fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
            fs.writeFileSync(this.filePath, JSON.stringify({ traces }, null, 2));
        } catch (error) {
            this.logger.error('Failed to save traces:', error);
        }
    }
}
