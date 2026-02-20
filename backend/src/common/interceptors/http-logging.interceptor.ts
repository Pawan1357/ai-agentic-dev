import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpCtx = context.switchToHttp();
    const request = httpCtx.getRequest<Request & { method: string; url: string; params: unknown; query: unknown; body: unknown }>();
    const response = httpCtx.getResponse<{ statusCode: number }>();
    const startedAt = Date.now();

    this.logger.log(
      JSON.stringify({
        type: 'incoming_request',
        method: request.method,
        path: request.url,
        params: request.params,
        query: request.query,
        body: request.body,
      }),
    );

    return next.handle().pipe(
      tap((payload) => {
        this.logger.log(
          JSON.stringify({
            type: 'outgoing_response',
            method: request.method,
            path: request.url,
            statusCode: response.statusCode,
            durationMs: Date.now() - startedAt,
            data: payload,
          }),
        );
      }),
    );
  }
}
