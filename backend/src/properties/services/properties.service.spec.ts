import { AppException } from '../../common/exceptions/app.exception';
import { PropertiesService } from './properties.service';

describe('PropertiesService', () => {
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
    markLatestAsHistorical: jest.fn(),
    create: jest.fn(),
    listVersions: jest.fn(),
  } as any;

  const auditRepository = {
    create: jest.fn(),
    list: jest.fn(),
  } as any;

  const brokerRepository = {
    listByPropertyVersionId: jest.fn(),
    replaceByPropertyVersionId: jest.fn(),
  } as any;

  const tenantRepository = {
    listByPropertyVersionId: jest.fn(),
    replaceByPropertyVersionId: jest.fn(),
  } as any;

  const service = new PropertiesService(connection, propertyRepository, auditRepository, brokerRepository, tenantRepository);

  const baseCore = {
    _id: 'ver-1',
    propertyId: 'property-1',
    version: '1.1',
    revision: 2,
    isHistorical: false,
    propertyDetails: {
      address: '504 N Ashe Ave',
      buildingSizeSf: 1000,
    },
    underwritingInputs: {
      estStartDate: '2025-01-01',
      holdPeriodYears: 5,
    },
  };

  const brokers = [
    {
      id: 'b1',
      name: 'Broker One',
      phone: '1',
      email: 'one@example.com',
      company: 'A',
      isDeleted: false,
    },
  ];

  const tenants = [
    {
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

  beforeEach(() => {
    jest.clearAllMocks();
    connection.startSession.mockResolvedValue(createSession());
    brokerRepository.listByPropertyVersionId.mockResolvedValue(brokers);
    tenantRepository.listByPropertyVersionId.mockResolvedValue(tenants);
  });

  it('returns version when found', async () => {
    propertyRepository.findOne.mockResolvedValue(baseCore);
    const result = await service.getVersion('property-1', '1.1');
    expect(result.propertyId).toBe('property-1');
    expect(result.brokers).toHaveLength(1);
    expect(result.tenants).toHaveLength(2);
  });

  it('throws not found when version missing', async () => {
    propertyRepository.findOne.mockResolvedValue(null);
    await expect(service.getVersion('property-1', '1.1')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('passes through list versions and audit', async () => {
    propertyRepository.listVersions.mockResolvedValue([{ version: '1.1' }]);
    auditRepository.list.mockResolvedValue([{ action: 'UPDATE_VERSION' }]);

    await expect(service.listVersions('property-1')).resolves.toEqual([{ version: '1.1' }]);
    await expect(service.listAudit('property-1', '1.1')).resolves.toEqual([{ action: 'UPDATE_VERSION' }]);
  });

  it('saves current version and writes audit', async () => {
    propertyRepository.findOne.mockResolvedValue(baseCore);
    propertyRepository.saveCurrentVersionAtomic.mockResolvedValue({ ...baseCore, revision: 3 });

    const dto = {
      expectedRevision: 2,
      propertyDetails: { ...baseCore.propertyDetails },
      underwritingInputs: { ...baseCore.underwritingInputs },
      brokers: [...brokers],
      tenants: tenants.filter((t: any) => !t.isVacant),
    } as any;

    const result = await service.saveCurrentVersion('property-1', '1.1', dto);
    expect(result.revision).toBe(3);
    expect(brokerRepository.replaceByPropertyVersionId).toHaveBeenCalled();
    expect(tenantRepository.replaceByPropertyVersionId).toHaveBeenCalled();
    expect(auditRepository.create).toHaveBeenCalledWith(expect.objectContaining({ action: 'UPDATE_VERSION' }), expect.anything());
  });

  it('rejects address mutation', async () => {
    propertyRepository.findOne.mockResolvedValue(baseCore);
    await expect(
      service.saveCurrentVersion('property-1', '1.1', {
        expectedRevision: 2,
        propertyDetails: { ...baseCore.propertyDetails, address: 'changed' },
        underwritingInputs: { ...baseCore.underwritingInputs },
        brokers: [],
        tenants: [],
      } as any),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('rejects revision mismatch on save', async () => {
    propertyRepository.findOne.mockResolvedValue(baseCore);
    propertyRepository.saveCurrentVersionAtomic.mockResolvedValue(null);

    await expect(
      service.saveCurrentVersion('property-1', '1.1', {
        expectedRevision: 2,
        propertyDetails: { ...baseCore.propertyDetails },
        underwritingInputs: { ...baseCore.underwritingInputs },
        brokers: [...brokers],
        tenants: tenants.filter((t: any) => !t.isVacant),
      } as any),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('save-as clones next semantic version', async () => {
    propertyRepository.findOne.mockResolvedValue(baseCore);
    propertyRepository.listVersions.mockResolvedValue([{ version: '1.1' }, { version: '1.3' }, { version: '1.2' }]);
    propertyRepository.create.mockResolvedValue({ ...baseCore, version: '1.4', revision: 0, _id: 'ver-2' });

    const result = await service.saveAsNextVersion('property-1', '1.1', { expectedRevision: 2 });
    expect(result.version).toBe('1.4');
    expect(propertyRepository.markLatestAsHistorical).toHaveBeenCalledWith('property-1', expect.anything());
    expect(auditRepository.create).toHaveBeenCalledWith(expect.objectContaining({ action: 'SAVE_AS' }), expect.anything());
  });

  it('save-as with draft data does not mutate current version', async () => {
    propertyRepository.findOne.mockResolvedValue(baseCore);
    propertyRepository.listVersions.mockResolvedValue([{ version: '1.1' }]);
    propertyRepository.create.mockResolvedValue({
      ...baseCore,
      _id: 'ver-2',
      version: '1.2',
      revision: 0,
      propertyDetails: { ...baseCore.propertyDetails, market: 'Draft Market' },
    });

    const result = await service.saveAsNextVersion('property-1', '1.1', {
      expectedRevision: 2,
      propertyDetails: { ...baseCore.propertyDetails, market: 'Draft Market' },
      underwritingInputs: { ...baseCore.underwritingInputs },
      brokers: [...brokers],
      tenants: tenants.map((tenant: any) => ({ ...tenant })),
    } as any);

    expect(result.version).toBe('1.2');
    expect(propertyRepository.saveCurrentVersionAtomic).not.toHaveBeenCalled();
  });

  it('save-as rejects partial draft payload', async () => {
    propertyRepository.findOne.mockResolvedValue(baseCore);
    await expect(
      service.saveAsNextVersion('property-1', '1.1', {
        expectedRevision: 2,
        propertyDetails: { ...baseCore.propertyDetails },
      } as any),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('save-as rejects malformed version values', async () => {
    propertyRepository.findOne.mockResolvedValue(baseCore);
    propertyRepository.listVersions.mockResolvedValue([{ version: 'bad' }]);

    await expect(service.saveAsNextVersion('property-1', '1.1', { expectedRevision: 2 })).rejects.toBeInstanceOf(AppException);
  });

  it('save-as rejects when source version is missing', async () => {
    propertyRepository.findOne.mockResolvedValue(null);
    await expect(service.saveAsNextVersion('property-1', '1.1', { expectedRevision: 2 })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('save-as rejects revision mismatch', async () => {
    propertyRepository.findOne.mockResolvedValue({ ...baseCore, revision: 99 });
    await expect(service.saveAsNextVersion('property-1', '1.1', { expectedRevision: 2 })).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('save-as rejects draft address mutation', async () => {
    propertyRepository.findOne.mockResolvedValue(baseCore);
    await expect(
      service.saveAsNextVersion('property-1', '1.1', {
        expectedRevision: 2,
        propertyDetails: { ...baseCore.propertyDetails, address: 'mutated' },
        underwritingInputs: { ...baseCore.underwritingInputs },
        brokers: [...brokers],
        tenants: tenants.map((tenant: any) => ({ ...tenant })),
      } as any),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('save-as rejects when no versions exist for next-version resolution', async () => {
    propertyRepository.findOne.mockResolvedValue(baseCore);
    propertyRepository.listVersions.mockResolvedValue([]);
    await expect(service.saveAsNextVersion('property-1', '1.1', { expectedRevision: 2 })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('save rejects duplicate broker ids', async () => {
    propertyRepository.findOne.mockResolvedValue(baseCore);
    await expect(
      service.saveCurrentVersion('property-1', '1.1', {
        expectedRevision: 2,
        propertyDetails: { ...baseCore.propertyDetails },
        underwritingInputs: { ...baseCore.underwritingInputs },
        brokers: [
          { ...brokers[0], id: 'same' },
          { ...brokers[0], id: 'same', email: 'dup@example.com' },
        ],
        tenants: tenants.filter((t: any) => !t.isVacant),
      } as any),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('save rejects vacant-row tampering', async () => {
    propertyRepository.findOne.mockResolvedValue(baseCore);
    await expect(
      service.saveCurrentVersion('property-1', '1.1', {
        expectedRevision: 2,
        propertyDetails: { ...baseCore.propertyDetails },
        underwritingInputs: { ...baseCore.underwritingInputs },
        brokers: [...brokers],
        tenants: [{ ...tenants[1], isVacant: false }],
      } as any),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('save rejects business-rule violations', async () => {
    propertyRepository.findOne.mockResolvedValue(baseCore);

    await expect(
      service.saveCurrentVersion('property-1', '1.1', {
        expectedRevision: 2,
        propertyDetails: { ...baseCore.propertyDetails, buildingSizeSf: 100 },
        underwritingInputs: { ...baseCore.underwritingInputs },
        brokers: [...brokers],
        tenants: [{ ...tenants[0], squareFeet: 500 }],
      } as any),
    ).rejects.toMatchObject({ code: 'VALIDATION' });

    await expect(
      service.saveCurrentVersion('property-1', '1.1', {
        expectedRevision: 2,
        propertyDetails: { ...baseCore.propertyDetails },
        underwritingInputs: { ...baseCore.underwritingInputs },
        brokers: [...brokers],
        tenants: [{ ...tenants[0], leaseStart: '2024-01-01' }],
      } as any),
    ).rejects.toMatchObject({ code: 'VALIDATION' });

    await expect(
      service.saveCurrentVersion('property-1', '1.1', {
        expectedRevision: 2,
        propertyDetails: { ...baseCore.propertyDetails },
        underwritingInputs: { ...baseCore.underwritingInputs, holdPeriodYears: 1 },
        brokers: [...brokers],
        tenants: [{ ...tenants[0], leaseEnd: '2030-01-01' }],
      } as any),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('save rejects historical versions', async () => {
    propertyRepository.findOne.mockResolvedValue({ ...baseCore, isHistorical: true });
    await expect(
      service.saveCurrentVersion('property-1', '1.1', {
        expectedRevision: 2,
        propertyDetails: { ...baseCore.propertyDetails },
        underwritingInputs: { ...baseCore.underwritingInputs },
        brokers: [...brokers],
        tenants: tenants.filter((t: any) => !t.isVacant),
      } as any),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('falls back when mongo transactions are unavailable', async () => {
    connection.startSession.mockResolvedValue({
      withTransaction: jest.fn().mockRejectedValue(new Error('Transaction numbers are only allowed on a replica set member')),
      endSession: jest.fn().mockResolvedValue(undefined),
    });
    propertyRepository.findOne.mockResolvedValue(baseCore);
    propertyRepository.saveCurrentVersionAtomic.mockResolvedValue({ ...baseCore, revision: 3 });

    const result = await service.saveCurrentVersion('property-1', '1.1', {
      expectedRevision: 2,
      propertyDetails: { ...baseCore.propertyDetails },
      underwritingInputs: { ...baseCore.underwritingInputs },
      brokers: [...brokers],
      tenants: tenants.filter((t: any) => !t.isVacant),
    } as any);

    expect(result.revision).toBe(3);
  });
});
