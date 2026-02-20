import { BrokersService } from './brokers.service';

describe('BrokersService', () => {
  const propertyRepository = {
    findOne: jest.fn(),
    saveCurrentVersionAtomic: jest.fn(),
  } as any;
  const brokerRepository = {
    listByPropertyVersionId: jest.fn(),
    replaceByPropertyVersionId: jest.fn(),
  } as any;
  const tenantRepository = {
    listByPropertyVersionId: jest.fn(),
  } as any;
  const auditRepository = {
    create: jest.fn(),
  } as any;

  const service = new BrokersService(propertyRepository, brokerRepository, tenantRepository, auditRepository);

  const baseEntity = {
    _id: 'ver-1',
    propertyId: 'property-1',
    version: '1.1',
    revision: 2,
    isHistorical: false,
  };

  const brokers = [
    {
      propertyVersionId: 'ver-1',
      propertyId: 'property-1',
      version: '1.1',
      id: 'b1',
      name: 'Broker One',
      phone: '1',
      email: 'one@example.com',
      company: 'A',
      isDeleted: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    propertyRepository.findOne.mockResolvedValue(baseEntity);
    propertyRepository.saveCurrentVersionAtomic.mockResolvedValue({ ...baseEntity, revision: 3, toObject: () => ({ ...baseEntity, revision: 3 }) });
    brokerRepository.listByPropertyVersionId.mockResolvedValue(brokers);
    brokerRepository.replaceByPropertyVersionId.mockResolvedValue(undefined);
    tenantRepository.listByPropertyVersionId.mockResolvedValue([]);
  });

  it('creates broker', async () => {
    const result = await service.createBroker('property-1', '1.1', 2, {
      name: 'New Broker',
      phone: '123',
      email: 'new@example.com',
      company: 'C',
    });

    expect(propertyRepository.saveCurrentVersionAtomic).toHaveBeenCalled();
    expect(brokerRepository.replaceByPropertyVersionId).toHaveBeenCalled();
    expect(result.brokers.length).toBeGreaterThan(0);
  });

  it('updates and deletes broker', async () => {
    await service.updateBroker('property-1', '1.1', 'b1', 2, {
      name: 'Updated',
      phone: '123',
      email: 'new@example.com',
      company: 'C',
    });
    await service.softDeleteBroker('property-1', '1.1', 'b1', 2);
    expect(auditRepository.create).toHaveBeenCalled();
  });

  it('rejects invalid cases', async () => {
    await expect(
      service.updateBroker('property-1', '1.1', 'b1', 1, {
        name: 'Updated',
        phone: '123',
        email: 'new@example.com',
        company: 'C',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });

    await expect(
      service.updateBroker('property-1', '1.1', 'missing', 2, {
        name: 'Updated',
        phone: '123',
        email: 'new@example.com',
        company: 'C',
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
