import { of } from 'rxjs';
import { PropertyApiService } from './property-api.service';

describe('PropertyApiService', () => {
  const http = jasmine.createSpyObj('HttpClient', ['get', 'put', 'post', 'delete']);
  const service = new PropertyApiService(http as any);

  beforeEach(() => {
    http.get.calls.reset();
    http.put.calls.reset();
    http.post.calls.reset();
    http.delete.calls.reset();
  });

  it('gets versions and unwraps response envelope', (done) => {
    http.get.and.returnValue(of({ success: true, data: [{ version: '1.1' }] }));
    service.getVersions('property-1').subscribe((versions) => {
      expect(http.get).toHaveBeenCalledWith('/api/properties/property-1/versions');
      expect(versions).toEqual([{ version: '1.1' } as any]);
      done();
    });
  });

  it('gets a specific version and unwraps response envelope', (done) => {
    http.get.and.returnValue(of({ success: true, data: { version: '1.1' } }));
    service.getVersion('property-1', '1.1').subscribe((version) => {
      expect(http.get).toHaveBeenCalledWith('/api/properties/property-1/versions/1.1');
      expect((version as any).version).toBe('1.1');
      done();
    });
  });

  it('saves a version and unwraps response envelope', (done) => {
    http.put.and.returnValue(of({ success: true, message: 'Saved ok', data: { version: '1.1' } }));
    service.saveVersion('property-1', '1.1', { expectedRevision: 1 }).subscribe((saved) => {
      expect(http.put).toHaveBeenCalledWith('/api/properties/property-1/versions/1.1', { expectedRevision: 1 });
      expect((saved as any).data.version).toBe('1.1');
      expect((saved as any).message).toBe('Saved ok');
      done();
    });
  });

  it('performs save-as and unwraps response envelope', (done) => {
    http.post.and.returnValue(of({ success: true, message: 'Save As ok', data: { version: '1.2' } }));
    service.saveAs('property-1', '1.1', { expectedRevision: 2 }).subscribe((saved) => {
      expect(http.post).toHaveBeenCalledWith('/api/properties/property-1/versions/1.1/save-as', { expectedRevision: 2 });
      expect((saved as any).data.version).toBe('1.2');
      expect((saved as any).message).toBe('Save As ok');
      done();
    });
  });

  it('deletes broker and unwraps response envelope', (done) => {
    http.delete.and.returnValue(of({ success: true, data: { version: '1.1' } }));
    service.softDeleteBroker('property-1', '1.1', 'b1', 2).subscribe((saved) => {
      expect(http.delete).toHaveBeenCalledWith('/api/properties/property-1/versions/1.1/brokers/b1?expectedRevision=2');
      expect((saved as any).version).toBe('1.1');
      done();
    });
  });
});
