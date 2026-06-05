import { ConfigService } from '../services/configService';

export enum LogLevel {
    Debug = 0,
    Info = 1,
    Warn = 2,
    Error = 3,
}

export class Logger {
    private static instance: Logger;
    private configService = ConfigService.getInstance();

    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    debug(message: string, ...args: unknown[]): void {
        if (this.configService.enableTracing) {
            console.log(`[DEBUG] ${message}`, ...args);
        }
    }

    info(message: string, ...args: unknown[]): void {
        console.log(`[INFO] ${message}`, ...args);
    }

    warn(message: string, ...args: unknown[]): void {
        console.warn(`[WARN] ${message}`, ...args);
    }

    error(message: string, ...args: unknown[]): void {
        console.error(`[ERROR] ${message}`, ...args);
    }
}
