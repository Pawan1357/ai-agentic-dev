import { Injectable, LoggerService } from '@nestjs/common';
import { createLogger, format, Logger, transports } from 'winston';

type LogLevel = 'info' | 'error' | 'warn' | 'debug' | 'verbose';
type StructuredLogEntry = {
  level: LogLevel;
  message: string;
  [key: string]: unknown;
};

@Injectable()
export class AppLoggerService implements LoggerService {
  private readonly fallbackContext = 'Application';
  private readonly winstonLogger: Logger;

  constructor() {
    this.winstonLogger = this.buildWinstonLogger();
  }

  log(message: unknown, context?: string): void {
    this.writeLog('info', message, context);
  }

  error(message: unknown, trace?: string, context?: string): void {
    this.writeLog('error', message, context, trace);
  }

  warn(message: unknown, context?: string): void {
    this.writeLog('warn', message, context);
  }

  debug(message: unknown, context?: string): void {
    this.writeLog('debug', message, context);
  }

  verbose(message: unknown, context?: string): void {
    this.writeLog('verbose', message, context);
  }

  private writeLog(level: LogLevel, message: unknown, context?: string, trace?: string): void {
    const payload: StructuredLogEntry = {
      level,
      logger: 'winston',
      context: context ?? this.fallbackContext,
      timestamp: new Date().toISOString(),
      message: this.normalizeMessage(message),
    };

    if (trace) {
      payload.trace = trace;
    }

    this.winstonLogger.log(payload);
  }

  private normalizeMessage(message: unknown): string {
    if (typeof message === 'string') {
      return message;
    }
    try {
      return JSON.stringify(message);
    } catch {
      return String(message);
    }
  }

  private buildWinstonLogger(): Logger {
    return createLogger({
      level: process.env.LOG_LEVEL ?? 'info',
      format: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
      defaultMeta: {
        service: 'assessment-backend',
      },
      transports: [new transports.Console()],
    });
  }
}
