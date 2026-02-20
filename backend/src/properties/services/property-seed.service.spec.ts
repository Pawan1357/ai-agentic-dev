import { PropertySeedService } from './property-seed.service';

describe('PropertySeedService', () => {
  it('does not reseed existing data', async () => {
    const repo = {
      findOne: jest.fn().mockResolvedValue({ id: 1 }),
      create: jest.fn(),
    } as any;
    const brokerRepo = { replaceByPropertyVersionId: jest.fn() } as any;
    const tenantRepo = { replaceByPropertyVersionId: jest.fn() } as any;

    const service = new PropertySeedService(repo, brokerRepo, tenantRepo);
    await service.onModuleInit();

    expect(repo.findOne).toHaveBeenCalledWith('property-1', '1.1');
    expect(repo.create).not.toHaveBeenCalled();
    expect(brokerRepo.replaceByPropertyVersionId).not.toHaveBeenCalled();
    expect(tenantRepo.replaceByPropertyVersionId).not.toHaveBeenCalled();
  });

  it('seeds when record missing', async () => {
    const repo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ _id: 'ver-1' }),
    } as any;
    const brokerRepo = { replaceByPropertyVersionId: jest.fn().mockResolvedValue(undefined) } as any;
    const tenantRepo = { replaceByPropertyVersionId: jest.fn().mockResolvedValue(undefined) } as any;

    const service = new PropertySeedService(repo, brokerRepo, tenantRepo);
    await service.onModuleInit();

    expect(repo.create).toHaveBeenCalled();
    expect(brokerRepo.replaceByPropertyVersionId).toHaveBeenCalledWith('ver-1', 'property-1', '1.1', expect.any(Array));
    expect(tenantRepo.replaceByPropertyVersionId).toHaveBeenCalledWith('ver-1', 'property-1', '1.1', expect.any(Array));
  });
});
