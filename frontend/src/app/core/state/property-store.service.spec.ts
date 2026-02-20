import { of } from 'rxjs';
import { PropertyApiService } from '../services/property-api.service';
import { PropertyStoreService } from './property-store.service';

describe('PropertyStoreService', () => {
  const baseProperty = {
    propertyId: 'property-1',
    version: '1.1',
    revision: 2,
    isLatest: true,
    isHistorical: false,
    propertyDetails: {
      address: '504 N Ashe Ave',
      market: 'A',
      subMarket: 'B',
      propertyType: 'Industrial',
      propertySubType: 'Multi Tenant',
      zoning: 'M-1',
      zoningDetails: 'M-1',
      listingType: 'Broker Listed',
      businessPlan: 'Light Value Add',
      sellerType: 'Private',
      lastTradePrice: 1,
      lastTradeDate: '2025-01-01',
      askingPrice: 1,
      bidAmount: 1,
      yearOneCapRate: 1,
      stabilizedCapRate: 1,
      vintage: 2000,
      buildingSizeSf: 1000,
      warehouseSf: 500,
      officeSf: 500,
      propertySizeAcres: 10,
      coverageRatio: 20,
      outdoorStorage: 'Yes',
      constructionType: 'Hybrid',
      clearHeightFt: 32,
      dockDoors: 2,
      driveInDoors: 1,
      heavyPower: 'Yes',
      sprinklerType: 'Wet',
    },
    underwritingInputs: {
      listPrice: 0,
      bid: 0,
      gpEquityStack: 0,
      lpEquityStack: 0,
      acqFee: 0,
      amFee: 0,
      promote: 0,
      prefHurdle: 0,
      propMgmtFee: 0,
      estStartDate: '2025-01-01',
      holdPeriodYears: 5,
      closingCostsPct: 0,
      saleCostsPct: 0,
      vacancyPct: 0,
      annualCapexReservesPct: 0,
      annualAdminExpPct: 0,
      expenseInflationPct: 0,
      exitCapRate: 0,
    },
    brokers: [
      {
        id: 'b1',
        name: 'Broker One',
        phone: '1',
        email: 'one@example.com',
        company: 'A',
        isDeleted: false,
      },
    ],
    tenants: [
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
    ],
  } as any;

  let api: jasmine.SpyObj<PropertyApiService>;
  let store: PropertyStoreService;

  beforeEach(() => {
    api = jasmine.createSpyObj<PropertyApiService>('PropertyApiService', [
      'getVersion',
      'saveVersion',
      'saveAs',
      'getVersions',
      'createBroker',
      'updateBroker',
      'softDeleteBroker',
      'createTenant',
      'updateTenant',
      'softDeleteTenant',
    ]);
    api.getVersions.and.returnValue(of([]));
    api.softDeleteBroker.and.returnValue(of(baseProperty));
    api.softDeleteTenant.and.returnValue(of(baseProperty));
    store = new PropertyStoreService(api);
  });

  it('loads property version with explicit version', (done) => {
    api.getVersion.and.returnValue(of(baseProperty));

    store.loadVersion('1.1').subscribe(() => {
      expect(api.getVersion).toHaveBeenCalledWith('property-1', '1.1');
      expect(store.hasUnsavedChanges()).toBeFalse();
      done();
    });
  });

  it('loads versions', (done) => {
    api.getVersions.and.returnValue(of([{ version: '1.1', revision: 0, isHistorical: false }] as any));
    store.loadVersions().subscribe((versions) => {
      expect(versions[0].version).toBe('1.1');
      done();
    });
  });

  it('patchDraft is a no-op when no property is loaded', () => {
    store.patchDraft((draft) => ({ ...draft, version: '1.2' }));
    expect(store.hasUnsavedChanges()).toBeFalse();
  });

  it('patchDraft mutates draft and marks dirty', (done) => {
    api.getVersion.and.returnValue(of(baseProperty));

    store.loadVersion().subscribe(() => {
      store.patchDraft((draft) => ({
        ...draft,
        propertyDetails: { ...draft.propertyDetails, market: 'B' },
      }));

      store.property$.subscribe((value) => {
        if (!value) {
          return;
        }
        expect(value.propertyDetails.market).toBe('B');
        expect(store.hasUnsavedChanges()).toBeTrue();
        done();
      });
    });
  });

  it('supports broker and tenant draft mutations', (done) => {
    api.getVersion.and.returnValue(of(baseProperty));
    store.loadVersion().subscribe(() => {
      store.addBrokerDraft();
      store.addTenantDraft();

      store.property$.subscribe((value) => {
        if (!value) {
          return;
        }
        expect(value.brokers.length).toBeGreaterThan(1);
        expect(value.tenants.filter((t: any) => !t.isVacant).length).toBeGreaterThan(1);
        done();
      });
    });
  });

  it('saveCurrent sends full payload and clears dirty flag', (done) => {
    api.getVersion.and.returnValue(of(baseProperty));
    api.saveVersion.and.returnValue(of({ data: { ...baseProperty, revision: 3 }, message: 'Saved ok' } as any));

    store.loadVersion().subscribe(() => {
      store.patchDraft((draft) => ({ ...draft, propertyDetails: { ...draft.propertyDetails, market: 'X' } }));

      store.saveCurrent().subscribe(() => {
        expect(api.saveVersion).toHaveBeenCalledWith('property-1', '1.1', jasmine.objectContaining({ expectedRevision: 2 }));
        expect(store.hasUnsavedChanges()).toBeFalse();
        done();
      });
    });
  });

  it('saveCurrent throws for frontend validation errors', (done) => {
    api.getVersion.and.returnValue(of({ ...baseProperty, tenants: [{ ...baseProperty.tenants[0], squareFeet: 2000 }] } as any));

    store.loadVersion().subscribe(() => {
      expect(() => store.saveCurrent()).toThrowError('Total tenant square footage must be <= property space');
      done();
    });
  });

  it('saveAsNextVersion calls API and clears dirty flag', (done) => {
    api.getVersion.and.returnValue(of(baseProperty));
    api.saveAs.and.returnValue(of({ data: { ...baseProperty, version: '1.2', revision: 0 }, message: 'Save As ok' } as any));

    store.loadVersion().subscribe(() => {
      store.patchDraft((draft) => ({ ...draft, version: '1.1' }));

      store.saveAsNextVersion().subscribe(() => {
        expect(api.saveAs).toHaveBeenCalledWith(
          'property-1',
          '1.1',
          jasmine.objectContaining({
            expectedRevision: 2,
            propertyDetails: jasmine.any(Object),
            underwritingInputs: jasmine.any(Object),
            brokers: jasmine.any(Array),
            tenants: jasmine.any(Array),
          }),
        );
        expect(store.hasUnsavedChanges()).toBeFalse();
        done();
      });
    });
  });

  it('uses broker API operations', (done) => {
    api.getVersion.and.returnValue(of(baseProperty));
    api.updateBroker.and.returnValue(of({ ...baseProperty, revision: 3 } as any));

    store.loadVersion().subscribe(() => {
      store.updateBrokerField('b1', 'name', 'Updated Name');

      store.saveBroker('b1').subscribe(() => {
        expect(api.updateBroker).toHaveBeenCalled();
        done();
      });
    });
  });

  it('uses tenant API operations', (done) => {
    api.getVersion.and.returnValue(of(baseProperty));
    api.updateTenant.and.returnValue(of({ ...baseProperty, revision: 3 } as any));

    store.loadVersion().subscribe(() => {
      store.updateTenantField('t1', 'tenantName', 'Updated Tenant');

      store.saveTenant('t1').subscribe(() => {
        expect(api.updateTenant).toHaveBeenCalled();
        done();
      });
    });
  });

  it('treats persisted temp-prefixed broker ids as updates, not creates', (done) => {
    const tempPrefixed = {
      ...baseProperty,
      brokers: [
        {
          id: 'temp-broker-legacy-1',
          name: 'Legacy Broker',
          phone: '1234567890',
          email: 'legacy@example.com',
          company: 'Legacy Co',
          isDeleted: false,
        },
      ],
    } as any;

    api.getVersion.and.returnValue(of(tempPrefixed));
    api.updateBroker.and.returnValue(of({ ...tempPrefixed, revision: 3 } as any));

    store.loadVersion().subscribe(() => {
      store.updateBrokerField('temp-broker-legacy-1', 'name', 'Legacy Broker Updated');
      store.saveBroker('temp-broker-legacy-1').subscribe(() => {
        expect(api.updateBroker).toHaveBeenCalled();
        expect(api.createBroker).not.toHaveBeenCalled();
        done();
      });
    });
  });

  it('materializes transient ids during main save payload', (done) => {
    api.getVersion.and.returnValue(of(baseProperty));
    api.saveVersion.and.returnValue(of({ data: { ...baseProperty, revision: 3 }, message: 'Saved ok' } as any));

    store.loadVersion().subscribe(() => {
      store.addBrokerDraft();
      store.addTenantDraft();

      store.saveCurrent().subscribe(() => {
        const savePayload = api.saveVersion.calls.mostRecent().args[2] as any;
        const hasTempBrokerId = savePayload.brokers.some((broker: any) => String(broker.id).startsWith('temp-'));
        const hasTempTenantId = savePayload.tenants.some((tenant: any) => !tenant.isVacant && String(tenant.id).startsWith('temp-'));
        expect(hasTempBrokerId).toBeFalse();
        expect(hasTempTenantId).toBeFalse();
        done();
      });
    });
  });

  it('throws when saving without loaded property', () => {
    expect(() => store.saveCurrent()).toThrowError('Property not loaded');
    expect(() => store.saveAsNextVersion()).toThrowError('Property not loaded');
  });
});
