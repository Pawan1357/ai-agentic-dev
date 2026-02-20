import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SuccessResponse } from '../interfaces/api-response.interface';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, SuccessResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<SuccessResponse<T>> {
    const req = context.switchToHttp().getRequest<Request & { url: string }>();

    return next.handle().pipe(
      map((data: T) => ({
        success: true,
        message: 'Request processed successfully',
        path: req.url,
        timestamp: new Date().toISOString(),
        data,
      })),
    );
  }
}
