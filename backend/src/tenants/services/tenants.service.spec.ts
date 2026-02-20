import { TenantsService } from './tenants.service';

describe('TenantsService', () => {
  const createSession = () => ({
    withTransaction: async (callback: () => Promise<void>) => callback(),
    endSession: jest.fn().mockResolvedValue(undefined),
  });

  const connection = {
    startSession: jest.fn().mockResolvedValue(createSession()),
  } as any;

  const propertyRepository = {
    findOne: jest.fn(),
    saveCurrentVersionAtomic: jest.fn(),
  } as any;

  const brokerRepository = {
    listByPropertyVersionId: jest.fn(),
  } as any;

  const tenantRepository = {
    listByPropertyVersionId: jest.fn(),
    replaceByPropertyVersionId: jest.fn(),
  } as any;

  const auditRepository = {
    create: jest.fn(),
  } as any;

  const service = new TenantsService(connection, propertyRepository, brokerRepository, tenantRepository, auditRepository);

  const baseEntity = {
    _id: 'ver-1',
    propertyId: 'property-1',
    version: '1.1',
    revision: 2,
    isHistorical: false,
    propertyDetails: {
      buildingSizeSf: 1000,
    },
    underwritingInputs: {
      estStartDate: '2025-01-01',
      holdPeriodYears: 5,
    },
  };

  const tenantRecords = [
    {
      propertyVersionId: 'ver-1',
      propertyId: 'property-1',
      version: '1.1',
      id: 't1',
      tenantName: 'Tenant One',
      creditType: 'National',
      squareFeet: 300,
      rentPsf: 20,
      annualEscalations: 2,
      leaseStart: '2025-01-02',
      leaseEnd: '2027-01-01',
      leaseType: 'NNN',
      renew: 'Yes',
      downtimeMonths: 0,
      tiPsf: 0,
      lcPsf: 0,
      isVacant: false,
      isDeleted: false,
    },
    {
      propertyVersionId: 'ver-1',
      propertyId: 'property-1',
      version: '1.1',
      id: 'vacant-row',
      tenantName: 'VACANT',
      creditType: 'N/A',
      squareFeet: 700,
      rentPsf: 0,
      annualEscalations: 0,
      leaseStart: '2025-01-02',
      leaseEnd: '2027-01-01',
      leaseType: 'N/A',
      renew: 'N/A',
      downtimeMonths: 0,
      tiPsf: 0,
      lcPsf: 0,
      isVacant: true,
      isDeleted: false,
    },
  ];

  const payload = {
    tenantName: 'T2',
    creditType: 'Regional',
    squareFeet: 100,
    rentPsf: 10,
    annualEscalations: 1,
    leaseStart: '2025-02-02',
    leaseEnd: '2026-02-02',
    leaseType: 'Gross',
    renew: 'No',
    downtimeMonths: 0,
    tiPsf: 0,
    lcPsf: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    connection.startSession.mockResolvedValue(createSession());
    propertyRepository.findOne.mockResolvedValue(baseEntity);
    propertyRepository.saveCurrentVersionAtomic.mockResolvedValue({ ...baseEntity, revision: 3, toObject: () => ({ ...baseEntity, revision: 3 }) });
    tenantRepository.listByPropertyVersionId.mockResolvedValue(tenantRecords);
    tenantRepository.replaceByPropertyVersionId.mockResolvedValue(undefined);
    brokerRepository.listByPropertyVersionId.mockResolvedValue([]);
  });

  it('creates, updates and soft deletes tenant', async () => {
    await service.createTenant('property-1', '1.1', 2, payload as any);
    await service.updateTenant('property-1', '1.1', 't1', 2, payload as any);
    await service.softDeleteTenant('property-1', '1.1', 't1', 2);

    expect(auditRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'TENANT_DELETE_SOFT' }),
      expect.anything(),
    );
  });

  it('rejects update/delete for vacant row id', async () => {
    await expect(service.updateTenant('property-1', '1.1', 'vacant-row', 2, payload as any)).rejects.toMatchObject({ code: 'VALIDATION' });
    await expect(service.softDeleteTenant('property-1', '1.1', 'vacant-row', 2)).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('rejects tenant update when tenant is missing', async () => {
    await expect(service.updateTenant('property-1', '1.1', 'missing-tenant', 2, payload as any)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('rejects conflict scenarios', async () => {
    await expect(service.updateTenant('property-1', '1.1', 't1', 1, payload as any)).rejects.toMatchObject({ code: 'CONFLICT' });

    propertyRepository.saveCurrentVersionAtomic.mockResolvedValue(null);
    await expect(service.softDeleteTenant('property-1', '1.1', 't1', 2)).rejects.toMatchObject({ code: 'CONFLICT' });
  });
});
