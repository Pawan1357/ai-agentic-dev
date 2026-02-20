import { ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { AppLoggerService } from '../logging/app-logger.service';
import { HttpLoggingInterceptor } from './http-logging.interceptor';

describe('HttpLoggingInterceptor', () => {
  it('logs incoming and outgoing payloads', (done) => {
    const logger = new AppLoggerService();
    const logSpy = jest.spyOn(logger, 'log').mockImplementation();
    const interceptor = new HttpLoggingInterceptor(logger);

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'GET',
          url: '/api/properties/property-1/versions',
          params: {},
          query: {},
          body: {},
        }),
        getResponse: () => ({ statusCode: 200 }),
      }),
    } as ExecutionContext;

    interceptor.intercept(context, { handle: () => of({ ok: true }) } as any).subscribe(() => {
      expect(logSpy).toHaveBeenCalledTimes(2);
      logSpy.mockRestore();
      done();
    });
  });
});
