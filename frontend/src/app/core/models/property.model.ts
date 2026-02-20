export interface Broker {
  id: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  isDeleted: boolean;
}

export interface Tenant {
  id: string;
  tenantName: string;
  creditType: string;
  squareFeet: number;
  rentPsf: number;
  annualEscalations: number;
  leaseStart: string;
  leaseEnd: string;
  leaseType: string;
  renew: string;
  downtimeMonths: number;
  tiPsf: number;
  lcPsf: number;
  isVacant: boolean;
  isDeleted: boolean;
}

export interface PropertyDetails {
  address: string;
  market: string;
  subMarket: string;
  propertyType: string;
  propertySubType: string;
  zoning: string;
  zoningDetails: string;
  listingType: string;
  businessPlan: string;
  sellerType: string;
  lastTradePrice: number;
  lastTradeDate: string;
  askingPrice: number;
  bidAmount: number;
  yearOneCapRate: number;
  stabilizedCapRate: number;
  vintage: number;
  buildingSizeSf: number;
  warehouseSf: number;
  officeSf: number;
  propertySizeAcres: number;
  coverageRatio: number;
  outdoorStorage: string;
  constructionType: string;
  clearHeightFt: number;
  dockDoors: number;
  driveInDoors: number;
  heavyPower: string;
  sprinklerType: string;
}

export interface UnderwritingInputs {
  listPrice: number;
  bid: number;
  gpEquityStack: number;
  lpEquityStack: number;
  acqFee: number;
  amFee: number;
  promote: number;
  prefHurdle: number;
  propMgmtFee: number;
  estStartDate: string;
  holdPeriodYears: number;
  closingCostsPct: number;
  saleCostsPct: number;
  vacancyPct: number;
  annualCapexReservesPct: number;
  annualAdminExpPct: number;
  expenseInflationPct: number;
  exitCapRate: number;
}

export interface PropertyVersion {
  propertyId: string;
  version: string;
  revision: number;
  isLatest: boolean;
  isHistorical: boolean;
  propertyDetails: PropertyDetails;
  underwritingInputs: UnderwritingInputs;
  brokers: Broker[];
  tenants: Tenant[];
}

export interface AuditChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface AuditLogEntry {
  propertyId: string;
  version: string;
  revision: number;
  updatedBy: string;
  action: string;
  changes: AuditChange[];
  changedFieldCount: number;
  createdAt: string;
  updatedAt: string;
}
