import { ArgumentsHost, BadRequestException, HttpStatus } from '@nestjs/common';
import { AppException } from '../exceptions/app.exception';
import { AppLoggerService } from '../logging/app-logger.service';
import { ApiExceptionFilter } from './api-exception.filter';

describe('ApiExceptionFilter', () => {
  const createHost = () => {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ url: '/api/test', method: 'GET' }),
      }),
    } as unknown as ArgumentsHost;

    return { host, status, json };
  };

  it('maps AppException to structured response', () => {
    const filter = new ApiExceptionFilter(new AppLoggerService());
    const { host, status, json } = createHost();

    filter.catch(new AppException('conflict', 'CONFLICT', { revision: 1 }), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        errorCode: 'CONFLICT',
        message: 'conflict',
      }),
    );
  });

  it('maps HttpException to structured response', () => {
    const filter = new ApiExceptionFilter(new AppLoggerService());
    const { host, status, json } = createHost();

    filter.catch(new BadRequestException('bad request'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: false, errorCode: 'HTTP_EXCEPTION' }));
  });

  it('maps unknown errors to internal server response', () => {
    const filter = new ApiExceptionFilter(new AppLoggerService());
    const { host, status, json } = createHost();

    filter.catch(new Error('boom'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: false, errorCode: 'INTERNAL_SERVER_ERROR' }));
  });

  it('maps mongo duplicate key errors to conflict response', () => {
    const filter = new ApiExceptionFilter(new AppLoggerService());
    const { host, status, json } = createHost();

    filter.catch({ code: 11000 }, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: false, errorCode: 'CONFLICT' }));
  });
});
