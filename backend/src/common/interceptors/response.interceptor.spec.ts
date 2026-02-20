import { ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';

describe('ResponseInterceptor', () => {
  it('wraps payload in generic success envelope', (done) => {
    const interceptor = new ResponseInterceptor();
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ url: '/api/properties/property-1/versions/1.1' }),
      }),
    } as ExecutionContext;

    interceptor.intercept(context, { handle: () => of({ id: 'x' }) } as any).subscribe((result) => {
      expect(result.success).toBe(true);
      expect(result.message).toBe('Request processed successfully');
      expect(result.path).toBe('/api/properties/property-1/versions/1.1');
      expect(result.data).toEqual({ id: 'x' });
      done();
    });
  });
});
