import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AppException } from '../../common/exceptions/app.exception';
import { AuditLogRepository } from '../../properties/repositories/audit-log.repository';
import { PropertyRepository } from '../../properties/repositories/property.repository';
import { buildDiff } from '../../properties/utils/diff.util';
import { TenantRepository } from '../../tenants/repositories/tenant.repository';
import { BrokerDto, UpsertBrokerDto } from '../dto/broker.dto';
import { BrokerRepository } from '../repositories/broker.repository';

const MOCK_USER = 'mock.user@assessment.local';

@Injectable()
export class BrokersService {
  constructor(
    private readonly propertyRepository: PropertyRepository,
    private readonly brokerRepository: BrokerRepository,
    private readonly tenantRepository: TenantRepository,
    private readonly auditRepository: AuditLogRepository,
  ) {}

  async createBroker(propertyId: string, version: string, expectedRevision: number, dto: UpsertBrokerDto): Promise<any> {
    const entity = await this.assertEditableVersion(propertyId, version);
    this.assertRevision(entity.revision, expectedRevision);

    const oldBrokers = await this.loadBrokers(entity);
    const brokers = [...oldBrokers, { ...dto, id: randomUUID(), isDeleted: false }];
    return this.persistBrokers(entity, oldBrokers, brokers, 'BROKER_CREATE');
  }

  async updateBroker(
    propertyId: string,
    version: string,
    brokerId: string,
    expectedRevision: number,
    dto: UpsertBrokerDto,
  ): Promise<any> {
    const entity = await this.assertEditableVersion(propertyId, version);
    this.assertRevision(entity.revision, expectedRevision);

    const oldBrokers = await this.loadBrokers(entity);
    this.assertBrokerMutable(oldBrokers, brokerId, 'update');

    const brokers = oldBrokers.map((broker: BrokerDto) => (broker.id === brokerId ? { ...broker, ...dto } : broker));
    return this.persistBrokers(entity, oldBrokers, brokers, 'BROKER_UPDATE');
  }

  async softDeleteBroker(propertyId: string, version: string, brokerId: string, expectedRevision: number): Promise<any> {
    const entity = await this.assertEditableVersion(propertyId, version);
    this.assertRevision(entity.revision, expectedRevision);

    const oldBrokers = await this.loadBrokers(entity);
    this.assertBrokerMutable(oldBrokers, brokerId, 'delete');

    const now = new Date().toISOString();
    const brokers = oldBrokers.map((broker: BrokerDto) =>
      broker.id === brokerId
        ? {
            ...broker,
            isDeleted: true,
            deletedAt: now,
            deletedBy: MOCK_USER,
          }
        : broker,
    );

    return this.persistBrokers(entity, oldBrokers, brokers, 'BROKER_DELETE_SOFT');
  }

  private async loadBrokers(entity: any): Promise<BrokerDto[]> {
    const persisted = await this.brokerRepository.listByPropertyVersionId(entity._id);
    if (persisted.length > 0) {
      return persisted.map((item) => this.stripMeta(item));
    }
    return Array.isArray(entity.brokers) ? entity.brokers : [];
  }

  private async persistBrokers(entity: any, oldBrokers: BrokerDto[], brokers: BrokerDto[], action: string) {
    const updatedCore = await this.propertyRepository.saveCurrentVersionAtomic(entity.propertyId, entity.version, entity.revision, {
      updatedBy: MOCK_USER,
    });
    if (!updatedCore) {
      throw new AppException('Revision mismatch detected. Reload latest data.', 'CONFLICT');
    }

    await this.brokerRepository.replaceByPropertyVersionId(entity._id, entity.propertyId, entity.version, brokers as any);
    const persisted = await this.brokerRepository.listByPropertyVersionId(entity._id);
    const normalizedBrokers = persisted.map((item) => this.stripMeta(item));

    const changes = buildDiff({ brokers: oldBrokers }, { brokers: normalizedBrokers });
    await this.auditRepository.create({
      propertyId: entity.propertyId,
      version: entity.version,
      revision: updatedCore.revision,
      updatedBy: MOCK_USER,
      action,
      changes,
      changedFieldCount: changes.length,
    });

    return {
      ...updatedCore.toObject(),
      brokers: normalizedBrokers,
      tenants: (await this.tenantRepository.listByPropertyVersionId(entity._id)).map((item) => this.stripMeta(item)),
    };
  }

  private assertRevision(currentRevision: number, expectedRevision: number) {
    if (currentRevision !== expectedRevision) {
      throw new AppException('Revision mismatch detected. Reload latest data.', 'CONFLICT');
    }
  }

  private async assertEditableVersion(propertyId: string, version: string) {
    const entity = await this.propertyRepository.findOne(propertyId, version);
    if (!entity) {
      throw new AppException('Property version not found', 'NOT_FOUND');
    }
    if (entity.isHistorical) {
      throw new AppException('Historical versions are read-only', 'CONFLICT');
    }
    return entity;
  }

  private assertBrokerMutable(brokers: BrokerDto[], brokerId: string, operation: 'update' | 'delete') {
    const broker = brokers.find((candidate) => candidate.id === brokerId);
    if (!broker) {
      throw new AppException('Broker not found', 'NOT_FOUND');
    }
    if (broker.isDeleted) {
      throw new AppException(`Cannot ${operation} a soft-deleted broker`, 'VALIDATION');
    }
  }

  private stripMeta(item: any): BrokerDto {
    const { propertyVersionId, propertyId, version, _id, __v, ...rest } = item;
    return rest as BrokerDto;
  }
}
