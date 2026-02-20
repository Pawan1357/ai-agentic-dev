import { AppException } from '../../common/exceptions/app.exception';
import { PropertiesController } from './properties.controller';

describe('PropertiesController', () => {
  const service = {
    listVersions: jest.fn(),
    getVersion: jest.fn(),
    listAudit: jest.fn(),
    saveCurrentVersion: jest.fn(),
    saveAsNextVersion: jest.fn(),
  } as any;

  const controller = new PropertiesController(service);

  beforeEach(() => jest.clearAllMocks());

  it('delegates list endpoints', async () => {
    service.listVersions.mockResolvedValue([]);
    service.listAudit.mockResolvedValue([]);

    await expect(controller.listVersions('p1')).resolves.toEqual([]);
    await expect(controller.listAudit('p1', '1.1')).resolves.toEqual([]);
  });

  it('delegates get/save/saveAs endpoints', async () => {
    service.getVersion.mockResolvedValue({ id: 'x' });
    service.saveCurrentVersion.mockResolvedValue({ id: 'x' });
    service.saveAsNextVersion.mockResolvedValue({ id: 'x' });

    await expect(controller.getVersion('p1', '1.1')).resolves.toEqual({ id: 'x' });
    await expect(controller.saveCurrentVersion('p1', '1.1', {} as any)).resolves.toEqual({ id: 'x' });
    await expect(controller.saveAsNextVersion('p1', '1.1', {} as any)).resolves.toEqual({ id: 'x' });
  });

  it('passes service exceptions through for global filter', async () => {
    service.getVersion.mockRejectedValue(new AppException('missing', 'NOT_FOUND'));
    await expect(controller.getVersion('p1', '1.1')).rejects.toBeInstanceOf(AppException);
  });
});
