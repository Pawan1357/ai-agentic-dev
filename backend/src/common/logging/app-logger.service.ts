import { Injectable, LoggerService } from '@nestjs/common';
import { createLogger, format, Logger, transports } from 'winston';
import { randomUUID } from 'crypto';

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

  resolveReferenceId(candidate?: unknown): string {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
    }
    return randomUUID().replace(/-/g, '').slice(0, 12);
  }

  private writeLog(level: LogLevel, message: unknown, context?: string, trace?: string): void {
    const normalized = this.normalizeMessage(message);
    const payload: StructuredLogEntry = {
      level,
      context: context ?? this.fallbackContext,
      timestamp: new Date().toISOString(),
      message: normalized.message,
      ...normalized.meta,
    };

    if (trace) {
      payload.trace = trace;
    }

    this.winstonLogger.log(payload);
  }

  private normalizeMessage(message: unknown): { message: string; meta?: Record<string, unknown> } {
    if (typeof message === 'string') {
      return { message };
    }

    if (typeof message === 'object' && message !== null && !Array.isArray(message)) {
      const candidate = message as Record<string, unknown>;
      const extractedMessage = typeof candidate.message === 'string' ? candidate.message : 'log-event';
      const { message: _discardMessage, ...meta } = candidate;
      return {
        message: extractedMessage,
        meta: Object.keys(meta).length > 0 ? meta : undefined,
      };
    }

    try {
      return { message: JSON.stringify(message) };
    } catch {
      return { message: String(message) };
    }
  }

  private buildWinstonLogger(): Logger {
    const shortConsoleFormat = format.printf((entry: Record<string, unknown>) => {
      const timestamp = String(entry.timestamp ?? new Date().toISOString());
      const level = String(entry.level ?? 'info').toUpperCase().padEnd(5);
      const context = String(entry.context ?? this.fallbackContext);
      const event = typeof entry.event === 'string' ? entry.event : '';
      const message = String(entry.message ?? '');

      const details = [
        this.formatField('ref', entry.ref),
        this.formatField('method', entry.method),
        this.formatField('path', entry.path),
        this.formatField('status', entry.statusCode),
        this.formatField('ms', entry.durationMs),
        this.formatField('code', entry.errorCode),
      ].filter((field): field is string => Boolean(field));

      return `${timestamp} ${level} [${context}] ${event} ${message}${details.length > 0 ? ` | ${details.join(' ')}` : ''}`.trim();
    });

    return createLogger({
      level: process.env.LOG_LEVEL ?? 'info',
      format: format.combine(format.timestamp(), format.errors({ stack: true }), shortConsoleFormat),
      defaultMeta: {
        service: 'assessment-backend',
      },
      transports: [new transports.Console()],
    });
  }

  private formatField(label: string, value: unknown): string | null {
    if (value === null || typeof value === 'undefined' || value === '') {
      return null;
    }
    return `${label}=${String(value)}`;
  }
}
