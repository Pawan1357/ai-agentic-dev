import { Component } from '@angular/core';
import { Tenant, UnderwritingInputs } from '../../core/models/property.model';
import { PropertyStoreService } from '../../core/state/property-store.service';
import { extractErrorMessage } from '../../core/utils/http-error.util';

@Component({
  selector: 'app-underwriting',
  templateUrl: './underwriting.component.html',
  styleUrls: ['./underwriting.component.css'],
})
export class UnderwritingComponent {
  actionError = '';

  readonly assumptionsFields: Array<{ label: string; key: keyof UnderwritingInputs; type: 'number' | 'date' }> = [
    { label: 'List Price', key: 'listPrice', type: 'number' },
    { label: 'Bid', key: 'bid', type: 'number' },
    { label: 'GP Equity Stack', key: 'gpEquityStack', type: 'number' },
    { label: 'LP Equity Stack', key: 'lpEquityStack', type: 'number' },
    { label: 'Acq Fee', key: 'acqFee', type: 'number' },
    { label: 'AM Fee', key: 'amFee', type: 'number' },
    { label: 'Promote', key: 'promote', type: 'number' },
    { label: 'Pref Hurdle', key: 'prefHurdle', type: 'number' },
    { label: 'Property Mgmt Fee', key: 'propMgmtFee', type: 'number' },
    { label: 'Est Start Date', key: 'estStartDate', type: 'date' },
    { label: 'Hold Period (Yrs)', key: 'holdPeriodYears', type: 'number' },
    { label: 'Closing Costs %', key: 'closingCostsPct', type: 'number' },
    { label: 'Sale Costs %', key: 'saleCostsPct', type: 'number' },
    { label: 'Vacancy %', key: 'vacancyPct', type: 'number' },
    { label: 'Annual Capex Res %', key: 'annualCapexReservesPct', type: 'number' },
    { label: 'Annual Admin Exp %', key: 'annualAdminExpPct', type: 'number' },
    { label: 'Expense Inflation %', key: 'expenseInflationPct', type: 'number' },
    { label: 'Exit Cap Rate', key: 'exitCapRate', type: 'number' },
  ];

  constructor(public readonly store: PropertyStoreService) {}

  onAddTenant() {
    this.actionError = '';
    if (!this.store.canAddBrokerOrTenant()) {
      return;
    }
    this.store.addTenantDraft();
  }

  onDeleteTenant(tenantId: string) {
    this.actionError = '';
    this.store.deleteTenant(tenantId).subscribe({
      error: (error: unknown) => {
        this.actionError = extractErrorMessage(error);
      },
    });
  }

  onSaveTenant(tenantId: string) {
    this.actionError = '';
    this.store.saveTenant(tenantId).subscribe({
      error: (error: unknown) => {
        this.actionError = extractErrorMessage(error);
      },
    });
  }

  onUnderwritingFieldChange(key: keyof UnderwritingInputs, event: Event) {
    this.store.clearServerFieldErrors([`underwritingInputs.${String(key)}`]);
    const input = event.target as HTMLInputElement;
    const value = input.type === 'date' ? input.value : Number(input.value || 0);
    this.store.updateUnderwritingField(key, value as UnderwritingInputs[typeof key]);
  }

  onTenantFieldChange<K extends keyof Tenant>(tenant: Tenant, tenantIndex: number, key: K, event: Event) {
    this.store.clearServerFieldErrors([`tenants.${tenantIndex}.${String(key)}`, `tenants.${String(key)}`]);
    const input = event.target as HTMLInputElement | HTMLSelectElement;
    const numericFields = new Set<keyof Tenant>(['squareFeet', 'rentPsf', 'annualEscalations', 'downtimeMonths', 'tiPsf', 'lcPsf']);
    const value = numericFields.has(key) ? Number(input.value || 0) : input.value;
    this.store.updateTenantField(tenant.id, key, value as Tenant[K]);
  }

  getUnderwritingFieldError(key: keyof UnderwritingInputs): string | null {
    return this.store.getServerFieldError(`underwritingInputs.${String(key)}`);
  }

  getTenantFieldError(
    tenantIndex: number,
    key: 'tenantName' | 'creditType' | 'squareFeet' | 'rentPsf' | 'annualEscalations' | 'leaseStart' | 'leaseEnd' | 'leaseType' | 'renew' | 'downtimeMonths' | 'tiPsf' | 'lcPsf',
  ): string | null {
    return this.store.getServerFieldError(`tenants.${tenantIndex}.${key}`) ?? this.store.getServerFieldError(`tenants.${key}`);
  }

  trackByTenantId(_index: number, tenant: Tenant): string {
    return tenant.id;
  }
}
