import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ClientSession, Connection } from 'mongoose';
import { randomUUID } from 'crypto';
import { BrokerRepository } from '../../brokers/repositories/broker.repository';
import { AppException } from '../../common/exceptions/app.exception';
import { AuditLogRepository } from '../../properties/repositories/audit-log.repository';
import { PropertyRepository } from '../../properties/repositories/property.repository';
import { buildDiff } from '../../properties/utils/diff.util';
import { TenantDto, UpsertTenantDto } from '../dto/tenant.dto';
import { TenantRepository } from '../repositories/tenant.repository';

const VACANT_TENANT_ID = 'vacant-row';
const MOCK_USER = 'mock.user@assessment.local';

@Injectable()
export class TenantsService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly propertyRepository: PropertyRepository,
    private readonly brokerRepository: BrokerRepository,
    private readonly tenantRepository: TenantRepository,
    private readonly auditRepository: AuditLogRepository,
  ) {}

  async createTenant(propertyId: string, version: string, expectedRevision: number, dto: UpsertTenantDto): Promise<any> {
    return this.runInTransaction(async (session) => {
      const entity = await this.assertEditableVersion(propertyId, version, session);
      this.assertRevision(entity.revision, expectedRevision);

      const oldTenants = await this.loadTenants(entity, session);
      const tenants = [...oldTenants.filter((t) => !t.isVacant), { ...dto, id: randomUUID(), isVacant: false, isDeleted: false }];
      return this.updateTenantsForEditableVersion(entity, oldTenants, tenants, 'TENANT_CREATE', session);
    });
  }

  async updateTenant(
    propertyId: string,
    version: string,
    tenantId: string,
    expectedRevision: number,
    dto: UpsertTenantDto,
  ): Promise<any> {
    return this.runInTransaction(async (session) => {
      const entity = await this.assertEditableVersion(propertyId, version, session);
      this.assertRevision(entity.revision, expectedRevision);

      const oldTenants = await this.loadTenants(entity, session);
      this.assertTenantMutable(oldTenants, tenantId, 'update');

      const tenants = oldTenants
        .filter((t) => !t.isVacant)
        .map((tenant) => (tenant.id === tenantId ? { ...tenant, ...dto } : tenant));
      return this.updateTenantsForEditableVersion(entity, oldTenants, tenants, 'TENANT_UPDATE', session);
    });
  }

  async softDeleteTenant(propertyId: string, version: string, tenantId: string, expectedRevision: number): Promise<any> {
    return this.runInTransaction(async (session) => {
      const entity = await this.assertEditableVersion(propertyId, version, session);
      this.assertRevision(entity.revision, expectedRevision);

      const oldTenants = await this.loadTenants(entity, session);
      this.assertTenantMutable(oldTenants, tenantId, 'delete');

      const now = new Date().toISOString();
      const tenants = oldTenants
        .filter((t) => !t.isVacant)
        .map((tenant) =>
          tenant.id === tenantId
            ? {
                ...tenant,
                isDeleted: true,
                deletedAt: now,
                deletedBy: MOCK_USER,
              }
            : tenant,
        );

      return this.updateTenantsForEditableVersion(entity, oldTenants, tenants, 'TENANT_DELETE_SOFT', session);
    });
  }

  private async loadTenants(entity: any, session?: ClientSession): Promise<TenantDto[]> {
    const persisted = await this.tenantRepository.listByPropertyVersionId(entity._id, session);
    if (persisted.length > 0) {
      return persisted.map((item) => this.stripMeta(item));
    }
    return Array.isArray(entity.tenants) ? entity.tenants : [];
  }

  private assertRevision(currentRevision: number, expectedRevision: number) {
    if (currentRevision !== expectedRevision) {
      throw new AppException('Revision mismatch detected. Reload latest data.', 'CONFLICT');
    }
  }

  private async assertEditableVersion(propertyId: string, version: string, session?: ClientSession) {
    const entity = await this.propertyRepository.findOne(propertyId, version, session);
    if (!entity) {
      throw new AppException('Property version not found', 'NOT_FOUND');
    }
    if (entity.isHistorical) {
      throw new AppException('Historical versions are read-only', 'CONFLICT');
    }
    return entity;
  }

  private assertTenantMutable(tenants: TenantDto[], tenantId: string, operation: 'update' | 'delete') {
    if (tenantId === VACANT_TENANT_ID) {
      throw new AppException('Vacant row is system-managed and cannot be modified directly', 'VALIDATION');
    }

    const tenant = tenants.find((candidate) => candidate.id === tenantId);
    if (!tenant) {
      throw new AppException('Tenant not found', 'NOT_FOUND');
    }
    if (tenant.isVacant) {
      throw new AppException('Vacant row is system-managed and cannot be modified directly', 'VALIDATION');
    }
    if (tenant.isDeleted) {
      throw new AppException(`Cannot ${operation} a soft-deleted tenant`, 'VALIDATION');
    }
  }

  private validateBusinessRules(buildingSizeSf: number, estStartDate: string, holdPeriodYears: number, tenants: TenantDto[]) {
    const activeTenants = tenants.filter((tenant) => !tenant.isVacant && !tenant.isDeleted);
    const totalSqFt = activeTenants.reduce((sum, tenant) => sum + tenant.squareFeet, 0);

    if (totalSqFt > buildingSizeSf) {
      throw new AppException('Total tenant square footage must be <= property space', 'VALIDATION');
    }

    for (const tenant of activeTenants) {
      const leaseStart = new Date(tenant.leaseStart);
      const leaseEnd = new Date(tenant.leaseEnd);
      const propertyStart = new Date(estStartDate);
      const maxLeaseEnd = new Date(leaseStart);
      maxLeaseEnd.setFullYear(maxLeaseEnd.getFullYear() + holdPeriodYears);

      if (leaseStart < propertyStart) {
        throw new AppException('Lease start cannot be before property start', 'VALIDATION');
      }

      if (leaseEnd < leaseStart) {
        throw new AppException('Lease end cannot be before lease start', 'VALIDATION');
      }

      if (leaseEnd > maxLeaseEnd) {
        throw new AppException('Lease end cannot exceed start + hold period', 'VALIDATION');
      }
    }
  }

  private normalizeTenants(tenants: TenantDto[], propertySf: number) {
    const activeRows = tenants.filter((tenant) => !tenant.isVacant).map((tenant) => ({ ...tenant }));
    const occupiedSf = activeRows.filter((tenant) => !tenant.isDeleted).reduce((sum, tenant) => sum + tenant.squareFeet, 0);
    const vacantSf = Math.max(0, propertySf - occupiedSf);

    const vacantRow: TenantDto = {
      id: VACANT_TENANT_ID,
      tenantName: 'VACANT',
      creditType: 'N/A',
      squareFeet: vacantSf,
      rentPsf: 0,
      annualEscalations: 0,
      leaseStart: activeRows[0]?.leaseStart ?? new Date().toISOString().slice(0, 10),
      leaseEnd: activeRows[0]?.leaseEnd ?? new Date().toISOString().slice(0, 10),
      leaseType: 'N/A',
      renew: 'N/A',
      downtimeMonths: 0,
      tiPsf: 0,
      lcPsf: 0,
      isVacant: true,
      isDeleted: false,
    };

    return [...activeRows, vacantRow];
  }

  private async updateTenantsForEditableVersion(
    entity: any,
    oldTenants: TenantDto[],
    tenants: TenantDto[],
    action: string,
    session?: ClientSession,
  ) {
    const normalized = this.normalizeTenants(tenants, entity.propertyDetails.buildingSizeSf);
    this.validateBusinessRules(
      entity.propertyDetails.buildingSizeSf,
      entity.underwritingInputs.estStartDate,
      entity.underwritingInputs.holdPeriodYears,
      normalized,
    );

    const updatedCore = await this.propertyRepository.saveCurrentVersionAtomic(
      entity.propertyId,
      entity.version,
      entity.revision,
      {
        updatedBy: MOCK_USER,
      },
      session,
    );

    if (!updatedCore) {
      throw new AppException('Revision mismatch detected. Reload latest data.', 'CONFLICT');
    }

    await this.tenantRepository.replaceByPropertyVersionId(entity._id, entity.propertyId, entity.version, normalized as any, session);
    const persistedTenants = await this.loadTenants(entity, session);

    const changes = buildDiff({ tenants: oldTenants }, { tenants: persistedTenants });
    await this.auditRepository.create(
      {
        propertyId: entity.propertyId,
        version: entity.version,
        revision: updatedCore.revision,
        updatedBy: MOCK_USER,
        action,
        changes,
        changedFieldCount: changes.length,
      },
      session,
    );

    return {
      ...updatedCore.toObject(),
      brokers: (await this.brokerRepository.listByPropertyVersionId(entity._id, session)).map((item) => this.stripBrokerMeta(item)),
      tenants: persistedTenants,
    };
  }

  private stripMeta(item: any): TenantDto {
    const { propertyVersionId, propertyId, version, _id, __v, ...rest } = item;
    return rest as TenantDto;
  }

  private stripBrokerMeta(item: any) {
    const { propertyVersionId, propertyId, version, _id, __v, ...rest } = item;
    return rest;
  }

  private async runInTransaction<T>(handler: (session?: ClientSession) => Promise<T>): Promise<T> {
    const session = await this.connection.startSession();
    try {
      let result: T;
      try {
        await session.withTransaction(async () => {
          result = await handler(session);
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!message.includes('Transaction numbers are only allowed')) {
          throw error;
        }
        result = await handler();
      }
      return result!;
    } finally {
      await session.endSession();
    }
  }
}
