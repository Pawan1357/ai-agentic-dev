import { TenantsController } from './tenants.controller';

describe('TenantsController', () => {
  const service = {
    createTenant: jest.fn(),
    updateTenant: jest.fn(),
    softDeleteTenant: jest.fn(),
  } as any;

  const controller = new TenantsController(service);

  beforeEach(() => jest.clearAllMocks());

  it('delegates tenant create/update/delete actions', async () => {
    service.createTenant.mockResolvedValue({ ok: true });
    service.updateTenant.mockResolvedValue({ ok: true });
    service.softDeleteTenant.mockResolvedValue({ ok: true });

    await controller.createTenant('p1', '1.1', 2, {
      tenantName: 't',
      creditType: 'n',
      squareFeet: 1,
      rentPsf: 1,
      annualEscalations: 1,
      leaseStart: '2025-01-01',
      leaseEnd: '2025-12-31',
      leaseType: 'NNN',
      renew: 'No',
      downtimeMonths: 0,
      tiPsf: 0,
      lcPsf: 0,
    });
    await controller.updateTenant('p1', '1.1', 't1', 2, {
      tenantName: 't',
      creditType: 'n',
      squareFeet: 1,
      rentPsf: 1,
      annualEscalations: 1,
      leaseStart: '2025-01-01',
      leaseEnd: '2025-12-31',
      leaseType: 'NNN',
      renew: 'No',
      downtimeMonths: 0,
      tiPsf: 0,
      lcPsf: 0,
    });
    await controller.softDeleteTenant('p1', '1.1', 't1', 2);

    expect(service.createTenant).toHaveBeenCalledWith('p1', '1.1', 2, expect.any(Object));
    expect(service.updateTenant).toHaveBeenCalledWith('p1', '1.1', 't1', 2, expect.any(Object));
    expect(service.softDeleteTenant).toHaveBeenCalledWith('p1', '1.1', 't1', 2);
  });
});
