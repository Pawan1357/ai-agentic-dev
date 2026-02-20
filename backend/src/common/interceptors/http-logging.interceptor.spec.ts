import { ExecutionContext, Logger } from '@nestjs/common';
import { of } from 'rxjs';
import { HttpLoggingInterceptor } from './http-logging.interceptor';

describe('HttpLoggingInterceptor', () => {
  it('logs incoming and outgoing payloads', (done) => {
    const interceptor = new HttpLoggingInterceptor();
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

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
