import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { AppException } from '../exceptions/app.exception';
import { ErrorResponse } from '../interfaces/api-response.interface';
import { AppLoggerService } from '../logging/app-logger.service';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<{ status: (statusCode: number) => { json: (body: ErrorResponse) => void } }>();
    const request = ctx.getRequest<Request & { url: string; method: string }>();

    const { statusCode, message, errorCode, details } = this.extractErrorInfo(exception);

    const errorBody: ErrorResponse = {
      success: false,
      message,
      errorCode,
      statusCode,
      path: request.url,
      timestamp: new Date().toISOString(),
      details,
    };

    this.logger.error(
      JSON.stringify({
        type: 'outgoing_error_response',
        method: request.method,
        path: request.url,
        statusCode,
        errorCode,
        message,
        details,
      }),
    );

    response.status(statusCode).json(errorBody);
  }

  private extractErrorInfo(exception: unknown): {
    statusCode: number;
    message: string;
    errorCode: string;
    details?: unknown;
  } {
    if (exception instanceof AppException) {
      const statusCode =
        exception.code === 'NOT_FOUND'
          ? HttpStatus.NOT_FOUND
          : exception.code === 'CONFLICT'
            ? HttpStatus.CONFLICT
            : HttpStatus.BAD_REQUEST;

      return {
        statusCode,
        message: exception.message,
        errorCode: exception.code,
        details: exception.details,
      };
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const response = exception.getResponse();
      const extractedMessage =
        typeof response === 'string'
          ? response
          : typeof response === 'object' && response !== null && 'message' in response
            ? (response as { message: string | string[] }).message
            : exception.message;

      return {
        statusCode,
        message: Array.isArray(extractedMessage) ? extractedMessage.join(', ') : extractedMessage,
        errorCode: 'HTTP_EXCEPTION',
        details: response,
      };
    }

    if (this.isMongoDuplicateKeyError(exception)) {
      return {
        statusCode: HttpStatus.CONFLICT,
        message: 'Version already exists. Reload versions and retry.',
        errorCode: 'CONFLICT',
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      errorCode: 'INTERNAL_SERVER_ERROR',
    };
  }

  private isMongoDuplicateKeyError(exception: unknown): boolean {
    if (typeof exception !== 'object' || exception === null) {
      return false;
    }
    const candidate = exception as { code?: unknown };
    return candidate.code === 11000;
  }
}
