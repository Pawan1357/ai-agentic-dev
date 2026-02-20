import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppLoggerService } from '../logging/app-logger.service';

type LoggedRequest = Request & {
  method: string;
  url: string;
  headers: Record<string, string | string[] | undefined>;
  logRef?: string;
};

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpCtx = context.switchToHttp();
    const request = httpCtx.getRequest<LoggedRequest>();
    const response = httpCtx.getResponse<{ statusCode: number }>();
    const startedAt = Date.now();
    const ref = this.resolveRequestRef(request);
    request.logRef = ref;

    this.logger.log(
      {
        event: 'HTTP_REQ',
        message: 'Incoming request',
        ref,
        method: request.method,
        path: request.url,
      },
      'HTTP',
    );

    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          {
            event: 'HTTP_RES',
            message: 'Request completed',
            ref,
            method: request.method,
            path: request.url,
            statusCode: response.statusCode,
            durationMs: Date.now() - startedAt,
          },
          'HTTP',
        );
      }),
    );
  }

  private resolveRequestRef(request: LoggedRequest): string {
    const headerValue = request.headers?.['x-request-id'];
    const candidate = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    return this.logger.resolveReferenceId(candidate);
  }
}
