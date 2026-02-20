import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError, tap } from 'rxjs';
import { Broker, PropertyVersion, Tenant } from '../models/property.model';
import { PropertyApiService } from '../services/property-api.service';
import { extractBackendErrorInfo } from '../utils/http-error.util';
import { validatePropertyDraft } from '../validators/property-validation.util';

interface VersionOption {
  version: string;
  revision: number;
  isHistorical: boolean;
}

@Injectable({ providedIn: 'root' })
export class PropertyStoreService {
  private readonly propertyId = 'property-1';
  private persistedProperty: PropertyVersion | null = null;

  private readonly propertySubject = new BehaviorSubject<PropertyVersion | null>(null);
  private readonly versionsSubject = new BehaviorSubject<VersionOption[]>([]);
  private readonly dirtySubject = new BehaviorSubject<boolean>(false);
  private readonly validationErrorsSubject = new BehaviorSubject<string[]>([]);
  private readonly serverFieldErrorsSubject = new BehaviorSubject<Record<string, string>>({});

  readonly property$: Observable<PropertyVersion | null> = this.propertySubject.asObservable();
  readonly versions$: Observable<VersionOption[]> = this.versionsSubject.asObservable();
  readonly isDirty$: Observable<boolean> = this.dirtySubject.asObservable();
  readonly validationErrors$: Observable<string[]> = this.validationErrorsSubject.asObservable();
  readonly serverFieldErrors$: Observable<Record<string, string>> = this.serverFieldErrorsSubject.asObservable();

  constructor(private readonly api: PropertyApiService) {}

  loadVersion(version = '1.1') {
    return this.api.getVersion(this.propertyId, version).pipe(
      tap((property) => {
        const normalized = this.normalizePropertySnapshot(property);
        this.persistedProperty = structuredClone(normalized);
        this.propertySubject.next(normalized);
        this.validationErrorsSubject.next([]);
        this.serverFieldErrorsSubject.next({});
        this.refreshDirtyState();
      }),
    );
  }

  loadVersions() {
    return this.api.getVersions(this.propertyId).pipe(tap((versions) => this.versionsSubject.next(versions)));
  }

  patchDraft(mutator: (draft: PropertyVersion) => PropertyVersion) {
    const current = this.propertySubject.value;
    if (!current) {
      return;
    }
    const nextDraft = mutator(structuredClone(current));
    this.propertySubject.next(nextDraft);
    if (this.validationErrorsSubject.value.length > 0) {
      const validationErrors = validatePropertyDraft(nextDraft);
      this.validationErrorsSubject.next(validationErrors);
      this.serverFieldErrorsSubject.next(this.mapValidationErrorsToFieldErrors(validationErrors, nextDraft));
    }
    this.refreshDirtyState();
  }

  updatePropertyDetailsField<K extends keyof PropertyVersion['propertyDetails']>(key: K, value: PropertyVersion['propertyDetails'][K]) {
    this.patchDraft((draft) => ({
      ...draft,
      propertyDetails: {
        ...draft.propertyDetails,
        [key]: value,
      },
    }));
  }

  updateUnderwritingField<K extends keyof PropertyVersion['underwritingInputs']>(
    key: K,
    value: PropertyVersion['underwritingInputs'][K],
  ) {
    this.patchDraft((draft) => ({
      ...draft,
      underwritingInputs: {
        ...draft.underwritingInputs,
        [key]: value,
      },
    }));
  }

  addBrokerDraft() {
    const broker: Broker = {
      id: this.generateId('temp-broker'),
      name: '',
      phone: '',
      email: '',
      company: '',
      isDeleted: false,
    };

    this.patchDraft((draft) => ({
      ...draft,
      brokers: [...draft.brokers, broker],
    }));
  }

  updateBrokerField(brokerId: string, key: keyof Broker, value: string | boolean) {
    this.patchDraft((draft) => ({
      ...draft,
      brokers: draft.brokers.map((broker) => (broker.id === brokerId ? { ...broker, [key]: value } : broker)),
    }));
  }

  deleteBroker(brokerId: string): Observable<PropertyVersion> {
    const current = this.propertySubject.value;
    if (!current) {
      return throwError(() => new Error('Property not loaded'));
    }

    if (this.isClientOnlyBrokerId(brokerId)) {
      this.patchDraft((draft) => ({
        ...draft,
        brokers: draft.brokers.filter((broker) => broker.id !== brokerId),
      }));
      return of(current);
    }

    const broker = current.brokers.find((candidate) => candidate.id === brokerId);
    if (!broker || broker.isDeleted) {
      return throwError(() => new Error('Broker not found'));
    }

    return this.api.softDeleteBroker(this.propertyId, current.version, brokerId, current.revision).pipe(
      tap((saved) => {
        this.persistCollectionUpdate(saved, 'brokers');
      }),
    );
  }

  saveBroker(brokerId: string): Observable<PropertyVersion> {
    const current = this.propertySubject.value;
    if (!current) {
      return throwError(() => new Error('Property not loaded'));
    }

    const broker = current.brokers.find((candidate) => candidate.id === brokerId);
    if (!broker) {
      return throwError(() => new Error('Broker not found in draft'));
    }

    const payload = this.sanitizeBroker(broker);

    if (!payload.name || !payload.phone || !payload.email || !payload.company) {
      return throwError(() => new Error('Broker name, phone, email and company are required'));
    }

    const request$ = this.isClientOnlyBrokerId(brokerId)
      ? this.api.createBroker(this.propertyId, current.version, current.revision, payload)
      : this.api.updateBroker(this.propertyId, current.version, brokerId, current.revision, payload);

    return request$.pipe(
      tap((saved) => {
        this.persistCollectionUpdate(saved, 'brokers');
      }),
    );
  }

  addTenantDraft() {
    const current = this.propertySubject.value;
    if (!current) {
      return;
    }

    const baseDate = current.underwritingInputs.estStartDate || new Date().toISOString().slice(0, 10);
    const leaseEnd = new Date(baseDate);
    leaseEnd.setFullYear(leaseEnd.getFullYear() + 1);

    const tenant: Tenant = {
      id: this.generateId('temp-tenant'),
      tenantName: '',
      creditType: 'Local',
      squareFeet: 0,
      rentPsf: 0,
      annualEscalations: 0,
      leaseStart: baseDate,
      leaseEnd: leaseEnd.toISOString().slice(0, 10),
      leaseType: 'Gross',
      renew: 'No',
      downtimeMonths: 0,
      tiPsf: 0,
      lcPsf: 0,
      isVacant: false,
      isDeleted: false,
    };

    this.patchDraft((draft) => ({
      ...draft,
      tenants: [...draft.tenants.filter((row) => !row.isVacant), tenant, ...draft.tenants.filter((row) => row.isVacant)],
    }));
  }

  addTenant() {
    this.addTenantDraft();
  }

  addBroker() {
    this.addBrokerDraft();
  }

  deleteTenant(tenantId: string): Observable<PropertyVersion> {
    const current = this.propertySubject.value;
    if (!current) {
      return throwError(() => new Error('Property not loaded'));
    }

    if (tenantId === 'vacant-row') {
      return throwError(() => new Error('Vacant row is system-managed and cannot be modified directly'));
    }

    if (this.isClientOnlyTenantId(tenantId)) {
      this.patchDraft((draft) => ({
        ...draft,
        tenants: draft.tenants.filter((tenant) => tenant.id !== tenantId),
      }));
      return of(current);
    }

    const tenant = current.tenants.find((candidate) => candidate.id === tenantId);
    if (!tenant || tenant.isDeleted || tenant.isVacant) {
      return throwError(() => new Error('Tenant not found'));
    }

    return this.api.softDeleteTenant(this.propertyId, current.version, tenantId, current.revision).pipe(
      tap((saved) => {
        this.persistCollectionUpdate(saved, 'tenants');
      }),
    );
  }

  updateTenantField<K extends keyof Tenant>(tenantId: string, key: K, value: Tenant[K]) {
    this.patchDraft((draft) => ({
      ...draft,
      tenants: draft.tenants.map((tenant) =>
        tenant.id === tenantId && !tenant.isVacant && !tenant.isDeleted ? { ...tenant, [key]: value } : tenant,
      ),
    }));
  }

  saveTenant(tenantId: string): Observable<PropertyVersion> {
    const current = this.propertySubject.value;
    if (!current) {
      return throwError(() => new Error('Property not loaded'));
    }

    if (tenantId === 'vacant-row') {
      return throwError(() => new Error('Vacant row is system-managed and cannot be modified directly'));
    }

    const tenant = current.tenants.find((candidate) => candidate.id === tenantId);
    if (!tenant) {
      return throwError(() => new Error('Tenant not found in draft'));
    }

    const payload = this.sanitizeTenant(tenant);

    if (!payload.tenantName) {
      return throwError(() => new Error('Tenant name is required'));
    }

    const request$ = this.isClientOnlyTenantId(tenantId)
      ? this.api.createTenant(this.propertyId, current.version, current.revision, payload)
      : this.api.updateTenant(this.propertyId, current.version, tenantId, current.revision, payload);

    return request$.pipe(
      tap((saved) => {
        this.persistCollectionUpdate(saved, 'tenants');
      }),
    );
  }

  saveCurrent() {
    const current = this.propertySubject.value;
    if (!current) {
      throw new Error('Property not loaded');
    }

    const validationErrors = validatePropertyDraft(current);
    this.validationErrorsSubject.next(validationErrors);
    if (validationErrors.length > 0) {
      this.serverFieldErrorsSubject.next(this.mapValidationErrorsToFieldErrors(validationErrors, current));
      throw new Error(validationErrors.join(' | '));
    }

    const saveShape = this.materializeTransientIds(current);
    const payload = {
      expectedRevision: current.revision,
      propertyDetails: current.propertyDetails,
      underwritingInputs: current.underwritingInputs,
      brokers: saveShape.brokers.map((broker) => ({
        id: broker.id,
        name: broker.name,
        phone: broker.phone,
        email: broker.email,
        company: broker.company,
        isDeleted: broker.isDeleted,
      })),
      tenants: saveShape.tenants.map((tenant) => ({
        id: tenant.id,
        tenantName: tenant.tenantName,
        creditType: tenant.creditType,
        squareFeet: tenant.squareFeet,
        rentPsf: tenant.rentPsf,
        annualEscalations: tenant.annualEscalations,
        leaseStart: tenant.leaseStart,
        leaseEnd: tenant.leaseEnd,
        leaseType: tenant.leaseType,
        renew: tenant.renew,
        downtimeMonths: tenant.downtimeMonths,
        tiPsf: tenant.tiPsf,
        lcPsf: tenant.lcPsf,
        isVacant: tenant.isVacant,
        isDeleted: tenant.isDeleted,
      })),
    };

    return this.api.saveVersion(this.propertyId, current.version, payload).pipe(
      tap((saved) => {
        const normalized = this.normalizePropertySnapshot(saved.data);
        this.persistedProperty = structuredClone(normalized);
        this.propertySubject.next(normalized);
        this.validationErrorsSubject.next([]);
        this.serverFieldErrorsSubject.next({});
        this.refreshDirtyState();
        this.loadVersions().subscribe();
      }),
    );
  }

  saveAsNextVersion() {
    const current = this.propertySubject.value;
    if (!current) {
      throw new Error('Property not loaded');
    }

    const saveShape = this.materializeTransientIds(current);
    const payload = {
      expectedRevision: current.revision,
      propertyDetails: current.propertyDetails,
      underwritingInputs: current.underwritingInputs,
      brokers: saveShape.brokers.map((broker) => ({
        id: broker.id,
        name: broker.name,
        phone: broker.phone,
        email: broker.email,
        company: broker.company,
        isDeleted: broker.isDeleted,
      })),
      tenants: saveShape.tenants.map((tenant) => ({
        id: tenant.id,
        tenantName: tenant.tenantName,
        creditType: tenant.creditType,
        squareFeet: tenant.squareFeet,
        rentPsf: tenant.rentPsf,
        annualEscalations: tenant.annualEscalations,
        leaseStart: tenant.leaseStart,
        leaseEnd: tenant.leaseEnd,
        leaseType: tenant.leaseType,
        renew: tenant.renew,
        downtimeMonths: tenant.downtimeMonths,
        tiPsf: tenant.tiPsf,
        lcPsf: tenant.lcPsf,
        isVacant: tenant.isVacant,
        isDeleted: tenant.isDeleted,
      })),
    };

    return this.api.saveAs(this.propertyId, current.version, payload).pipe(
      tap((saved) => {
        const normalized = this.normalizePropertySnapshot(saved.data);
        this.persistedProperty = structuredClone(normalized);
        this.propertySubject.next(normalized);
        this.serverFieldErrorsSubject.next({});
        this.refreshDirtyState();
        this.loadVersions().subscribe();
      }),
    );
  }

  hasUnsavedChanges(): boolean {
    return this.dirtySubject.value;
  }

  getCurrentVersion(): string {
    return this.propertySubject.value?.version ?? '';
  }

  setServerErrors(error: unknown) {
    const parsed = extractBackendErrorInfo(error);
    this.serverFieldErrorsSubject.next(parsed.fieldErrors);
  }

  getServerFieldError(path: string): string | null {
    return this.serverFieldErrorsSubject.value[path] ?? null;
  }

  clearServerFieldErrors(paths: string[]) {
    const current = { ...this.serverFieldErrorsSubject.value };
    for (const path of paths) {
      delete current[path];
    }
    this.serverFieldErrorsSubject.next(current);
  }

  hasServerFieldErrors(): boolean {
    return Object.keys(this.serverFieldErrorsSubject.value).length > 0;
  }

  canAddBrokerOrTenant(): boolean {
    const current = this.propertySubject.value;
    return !!current && !current.isHistorical;
  }

  canSaveBroker(brokerId: string): boolean {
    const current = this.propertySubject.value;
    if (!current || current.isHistorical) {
      return false;
    }

    const broker = current.brokers.find((item) => item.id === brokerId);
    if (!broker || broker.isDeleted) {
      return false;
    }

    const payload = this.sanitizeBroker(broker);
    if (!payload.name || !payload.phone || !payload.email || !payload.company) {
      return false;
    }
    if (!/^[0-9+\-()\s]+$/.test(payload.phone)) {
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      return false;
    }

    if (this.isClientOnlyBrokerId(brokerId)) {
      return true;
    }

    const persisted = this.persistedProperty?.brokers.find((item) => item.id === brokerId);
    if (!persisted) {
      return false;
    }

    return JSON.stringify(payload) !== JSON.stringify(this.sanitizeBroker(persisted));
  }

  canDeleteBroker(brokerId: string): boolean {
    const current = this.propertySubject.value;
    if (!current || current.isHistorical) {
      return false;
    }

    const broker = current.brokers.find((item) => item.id === brokerId);
    return !!broker && !broker.isDeleted;
  }

  canSaveTenant(tenantId: string): boolean {
    const current = this.propertySubject.value;
    if (!current || current.isHistorical || tenantId === 'vacant-row') {
      return false;
    }

    const tenant = current.tenants.find((item) => item.id === tenantId);
    if (!tenant || tenant.isDeleted || tenant.isVacant) {
      return false;
    }

    const payload = this.sanitizeTenant(tenant);
    if (!payload.tenantName) {
      return false;
    }

    if (this.isClientOnlyTenantId(tenantId)) {
      return true;
    }

    const persisted = this.persistedProperty?.tenants.find((item) => item.id === tenantId);
    if (!persisted) {
      return false;
    }

    return JSON.stringify(payload) !== JSON.stringify(this.sanitizeTenant(persisted));
  }

  canDeleteTenant(tenantId: string): boolean {
    const current = this.propertySubject.value;
    if (!current || current.isHistorical || tenantId === 'vacant-row') {
      return false;
    }

    const tenant = current.tenants.find((item) => item.id === tenantId);
    return !!tenant && !tenant.isDeleted && !tenant.isVacant;
  }

  private generateId(prefix: string): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return `${prefix}-${crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  private isTempId(id: string): boolean {
    return id.startsWith('temp-');
  }

  private isClientOnlyBrokerId(id: string): boolean {
    if (!this.isTempId(id)) {
      return false;
    }
    return !this.persistedProperty?.brokers.some((broker) => broker.id === id);
  }

  private isClientOnlyTenantId(id: string): boolean {
    if (!this.isTempId(id)) {
      return false;
    }
    return !this.persistedProperty?.tenants.some((tenant) => tenant.id === id);
  }

  private sanitizeBroker(broker: Broker): Omit<Broker, 'id' | 'isDeleted'> {
    return {
      name: broker.name?.trim(),
      phone: broker.phone?.trim(),
      email: broker.email?.trim(),
      company: broker.company?.trim(),
    };
  }

  private sanitizeTenant(tenant: Tenant): Omit<Tenant, 'id' | 'isVacant' | 'isDeleted'> {
    return {
      tenantName: tenant.tenantName?.trim(),
      creditType: tenant.creditType,
      squareFeet: tenant.squareFeet,
      rentPsf: tenant.rentPsf,
      annualEscalations: tenant.annualEscalations,
      leaseStart: tenant.leaseStart,
      leaseEnd: tenant.leaseEnd,
      leaseType: tenant.leaseType,
      renew: tenant.renew,
      downtimeMonths: tenant.downtimeMonths,
      tiPsf: tenant.tiPsf,
      lcPsf: tenant.lcPsf,
    };
  }

  private materializeTransientIds(current: PropertyVersion): Pick<PropertyVersion, 'brokers' | 'tenants'> {
    const brokerIds = new Set(current.brokers.map((broker) => broker.id));
    const tenantIds = new Set(current.tenants.map((tenant) => tenant.id));

    const brokers = current.brokers.map((broker) => {
      if (!this.isClientOnlyBrokerId(broker.id)) {
        return broker;
      }
      let nextId = this.generateId('broker');
      while (brokerIds.has(nextId)) {
        nextId = this.generateId('broker');
      }
      brokerIds.add(nextId);
      return { ...broker, id: nextId };
    });

    const tenants = current.tenants.map((tenant) => {
      if (tenant.isVacant || !this.isClientOnlyTenantId(tenant.id)) {
        return tenant;
      }
      let nextId = this.generateId('tenant');
      while (tenantIds.has(nextId)) {
        nextId = this.generateId('tenant');
      }
      tenantIds.add(nextId);
      return { ...tenant, id: nextId };
    });

    return { brokers, tenants };
  }

  private persistCollectionUpdate(saved: PropertyVersion, collection: 'brokers' | 'tenants') {
    const currentDraft = this.propertySubject.value;
    const normalizedSaved = this.normalizePropertySnapshot(saved);
    this.persistedProperty = structuredClone(normalizedSaved);
    if (!currentDraft) {
      this.propertySubject.next(normalizedSaved);
      this.refreshDirtyState();
      return;
    }

    const merged: PropertyVersion = {
      ...normalizedSaved,
      propertyDetails: currentDraft.propertyDetails,
      underwritingInputs: currentDraft.underwritingInputs,
      brokers: collection === 'brokers' ? normalizedSaved.brokers : currentDraft.brokers,
      tenants: collection === 'tenants' ? normalizedSaved.tenants : currentDraft.tenants,
    };

    this.propertySubject.next(merged);
    this.refreshDirtyState();
    this.validationErrorsSubject.next([]);
    this.loadVersions().subscribe();
  }

  private normalizePropertySnapshot(property: PropertyVersion): PropertyVersion {
    return {
      ...property,
      brokers: property.brokers.map((broker) => ({
        id: broker.id,
        name: broker.name,
        phone: broker.phone,
        email: broker.email,
        company: broker.company,
        isDeleted: broker.isDeleted,
      })),
      tenants: property.tenants.map((tenant) => ({
        id: tenant.id,
        tenantName: tenant.tenantName,
        creditType: tenant.creditType,
        squareFeet: tenant.squareFeet,
        rentPsf: tenant.rentPsf,
        annualEscalations: tenant.annualEscalations,
        leaseStart: tenant.leaseStart,
        leaseEnd: tenant.leaseEnd,
        leaseType: tenant.leaseType,
        renew: tenant.renew,
        downtimeMonths: tenant.downtimeMonths,
        tiPsf: tenant.tiPsf,
        lcPsf: tenant.lcPsf,
        isVacant: tenant.isVacant,
        isDeleted: tenant.isDeleted,
      })),
    };
  }

  private refreshDirtyState() {
    const current = this.propertySubject.value;
    const persisted = this.persistedProperty;
    if (!current || !persisted) {
      this.dirtySubject.next(false);
      return;
    }
    this.dirtySubject.next(JSON.stringify(current) !== JSON.stringify(persisted));
  }

  private mapValidationErrorsToFieldErrors(validationErrors: string[], draft: PropertyVersion): Record<string, string> {
    const fieldErrors: Record<string, string> = {};
    const activeBrokers = draft.brokers.filter((broker) => !broker.isDeleted);
    const activeTenants = draft.tenants.filter((tenant) => !tenant.isDeleted && !tenant.isVacant);

    for (const message of validationErrors) {
      if (message.includes('Building Size (SF)')) {
        fieldErrors['propertyDetails.buildingSizeSf'] = message;
      } else if (message.includes('Est Start Date is invalid')) {
        fieldErrors['underwritingInputs.estStartDate'] = message;
      } else if (message.includes('Hold Period (Yrs)')) {
        fieldErrors['underwritingInputs.holdPeriodYears'] = message;
      } else if (message.includes('Total tenant square footage')) {
        fieldErrors['tenants.squareFeet'] = message;
      }

      const brokerMatch = message.match(/^Broker (\d+): (.+)$/);
      if (brokerMatch) {
        const brokerNumber = Number(brokerMatch[1]);
        const broker = activeBrokers[brokerNumber - 1];
        if (!broker) {
          continue;
        }
        const brokerIndex = draft.brokers.findIndex((item) => item.id === broker.id);
        const detail = brokerMatch[2].toLowerCase();
        if (detail.includes('name')) {
          fieldErrors[`brokers.${brokerIndex}.name`] = message;
        } else if (detail.includes('phone')) {
          fieldErrors[`brokers.${brokerIndex}.phone`] = message;
        } else if (detail.includes('email')) {
          fieldErrors[`brokers.${brokerIndex}.email`] = message;
        } else if (detail.includes('company')) {
          fieldErrors[`brokers.${brokerIndex}.company`] = message;
        }
      }

      const tenantMatch = message.match(/^Tenant (\d+): (.+)$/);
      if (tenantMatch) {
        const tenantNumber = Number(tenantMatch[1]);
        const tenant = activeTenants[tenantNumber - 1];
        if (!tenant) {
          continue;
        }
        const tenantIndex = draft.tenants.findIndex((item) => item.id === tenant.id);
        const detail = tenantMatch[2].toLowerCase();
        if (detail.includes('tenant name')) {
          fieldErrors[`tenants.${tenantIndex}.tenantName`] = message;
        } else if (detail.includes('square feet')) {
          fieldErrors[`tenants.${tenantIndex}.squareFeet`] = message;
        } else if (detail.includes('rent')) {
          fieldErrors[`tenants.${tenantIndex}.rentPsf`] = message;
        } else if (detail.includes('escalation')) {
          fieldErrors[`tenants.${tenantIndex}.annualEscalations`] = message;
        } else if (detail.includes('downtime')) {
          fieldErrors[`tenants.${tenantIndex}.downtimeMonths`] = message;
        } else if (detail.includes('lease start')) {
          fieldErrors[`tenants.${tenantIndex}.leaseStart`] = message;
        } else if (detail.includes('lease end')) {
          fieldErrors[`tenants.${tenantIndex}.leaseEnd`] = message;
        }
      }
    }

    return fieldErrors;
  }
}
