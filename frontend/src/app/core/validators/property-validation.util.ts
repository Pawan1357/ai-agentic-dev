import { Broker, PropertyVersion, Tenant } from '../models/property.model';

const VACANT_TENANT_ID = 'vacant-row';

function isValidDate(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime());
}

function ensureBrokerValid(broker: Broker, index: number, errors: string[]) {
  if (!broker.id) {
    errors.push(`Broker ${index + 1}: Internal ID is missing`);
  }
  if (!broker.name.trim()) {
    errors.push(`Broker ${index + 1}: Name is required`);
  }
  if (!broker.phone.trim()) {
    errors.push(`Broker ${index + 1}: Phone number is required`);
  }
  if (broker.phone.trim() && !/^[0-9+\-()\s]+$/.test(broker.phone)) {
    errors.push(`Broker ${index + 1}: Enter a valid phone number`);
  }
  if (!broker.company.trim()) {
    errors.push(`Broker ${index + 1}: Company name is required`);
  }
  if (!broker.email.trim()) {
    errors.push(`Broker ${index + 1}: Email address is required`);
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(broker.email)) {
    errors.push(`Broker ${index + 1}: Enter a valid email address`);
  }
}

function ensureTenantValid(tenant: Tenant, index: number, errors: string[]) {
  if (!tenant.id) {
    errors.push(`Tenant ${index + 1}: Internal ID is missing`);
  }
  if (!tenant.tenantName.trim()) {
    errors.push(`Tenant ${index + 1}: Tenant name is required`);
  }
  if (tenant.squareFeet < 0) {
    errors.push(`Tenant ${index + 1}: Square feet must be 0 or more`);
  }
  if (tenant.rentPsf < 0 || tenant.annualEscalations < 0 || tenant.tiPsf < 0 || tenant.lcPsf < 0) {
    errors.push(`Tenant ${index + 1}: Rent, escalation, TI and LC values must be 0 or more`);
  }
  if (tenant.downtimeMonths < 0) {
    errors.push(`Tenant ${index + 1}: Downtime must be 0 or more`);
  }
  if (!isValidDate(tenant.leaseStart) || !isValidDate(tenant.leaseEnd)) {
    errors.push(`Tenant ${index + 1}: Lease start and lease end must be valid dates`);
  }
}

export function validatePropertyDraft(draft: PropertyVersion): string[] {
  const errors: string[] = [];

  if (!draft.propertyDetails.address.trim()) {
    errors.push('Property address is required');
  }
  if (draft.propertyDetails.buildingSizeSf <= 0) {
    errors.push('Building Size (SF) must be greater than 0');
  }
  if (!isValidDate(draft.underwritingInputs.estStartDate)) {
    errors.push('Est Start Date is invalid');
  }
  if (draft.underwritingInputs.holdPeriodYears <= 0) {
    errors.push('Hold Period (Yrs) must be greater than 0');
  }

  const activeBrokers = draft.brokers.filter((broker) => !broker.isDeleted);
  const brokerIds = activeBrokers.map((broker) => broker.id);
  if (new Set(brokerIds).size !== brokerIds.length) {
    errors.push('Broker IDs must be unique');
  }
  activeBrokers.forEach((broker, index) => ensureBrokerValid(broker, index, errors));

  const activeTenants = draft.tenants.filter((tenant) => !tenant.isVacant && !tenant.isDeleted);
  const tenantIds = activeTenants.map((tenant) => tenant.id);
  if (new Set(tenantIds).size !== tenantIds.length) {
    errors.push('Tenant IDs must be unique for non-vacant rows');
  }

  const badVacantRows = draft.tenants.filter((tenant) => tenant.id === VACANT_TENANT_ID && !tenant.isVacant);
  if (badVacantRows.length > 0) {
    errors.push('Vacant row is system-managed and cannot be modified directly');
  }

  activeTenants.forEach((tenant, index) => ensureTenantValid(tenant, index, errors));

  const totalSqFt = activeTenants.filter((tenant) => !tenant.isDeleted).reduce((acc, tenant) => acc + tenant.squareFeet, 0);
  if (totalSqFt > draft.propertyDetails.buildingSizeSf) {
    errors.push('Total tenant square footage must be <= property space');
  }

  for (let index = 0; index < activeTenants.length; index += 1) {
    const tenant = activeTenants[index];
    const leaseStart = new Date(tenant.leaseStart);
    const leaseEnd = new Date(tenant.leaseEnd);
    const propertyStart = new Date(draft.underwritingInputs.estStartDate);
    const maxLeaseEnd = new Date(leaseStart);
    maxLeaseEnd.setFullYear(maxLeaseEnd.getFullYear() + draft.underwritingInputs.holdPeriodYears);

    if (leaseStart < propertyStart) {
      errors.push(`Tenant ${index + 1}: Lease start date cannot be before Est Start Date`);
    }
    if (leaseEnd > maxLeaseEnd) {
      errors.push(`Tenant ${index + 1}: Lease end date cannot exceed lease start + hold period`);
    }
  }

  return errors;
}
