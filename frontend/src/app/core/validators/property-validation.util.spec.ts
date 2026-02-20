import { validatePropertyDraft } from './property-validation.util';

describe('validatePropertyDraft', () => {
  const validDraft = {
    propertyDetails: {
      address: '504 N Ashe Ave',
      market: 'Charlotte',
      subMarket: 'Southwest Charlotte',
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

  it('returns no errors for valid draft', () => {
    expect(validatePropertyDraft(validDraft)).toEqual([]);
  });

  it('rejects managed vacant-row tampering', () => {
    const invalid = {
      ...validDraft,
      tenants: [{ ...validDraft.tenants[0], id: 'vacant-row', isVacant: false }],
    };

    expect(validatePropertyDraft(invalid)).toContain('Vacant row is system-managed and cannot be modified directly');
  });

  it('rejects sqft overflow', () => {
    const invalid = {
      ...validDraft,
      tenants: [{ ...validDraft.tenants[0], squareFeet: 2001 }],
    };

    expect(validatePropertyDraft(invalid)).toContain('Total tenant square footage must be <= property space');
  });
});
