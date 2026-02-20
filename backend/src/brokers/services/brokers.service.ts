import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ClientSession, Connection } from 'mongoose';
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
    @InjectConnection() private readonly connection: Connection,
    private readonly propertyRepository: PropertyRepository,
    private readonly brokerRepository: BrokerRepository,
    private readonly tenantRepository: TenantRepository,
    private readonly auditRepository: AuditLogRepository,
  ) {}

  async createBroker(propertyId: string, version: string, expectedRevision: number, dto: UpsertBrokerDto): Promise<any> {
    return this.runInTransaction(async (session) => {
      const entity = await this.assertEditableVersion(propertyId, version, session);
      this.assertRevision(entity.revision, expectedRevision);

      const oldBrokers = await this.loadBrokers(entity, session);
      const brokers = [...oldBrokers, { ...dto, id: randomUUID(), isDeleted: false }];
      return this.persistBrokers(entity, oldBrokers, brokers, 'BROKER_CREATE', session);
    });
  }

  async updateBroker(
    propertyId: string,
    version: string,
    brokerId: string,
    expectedRevision: number,
    dto: UpsertBrokerDto,
  ): Promise<any> {
    return this.runInTransaction(async (session) => {
      const entity = await this.assertEditableVersion(propertyId, version, session);
      this.assertRevision(entity.revision, expectedRevision);

      const oldBrokers = await this.loadBrokers(entity, session);
      this.assertBrokerMutable(oldBrokers, brokerId, 'update');

      const brokers = oldBrokers.map((broker: BrokerDto) => (broker.id === brokerId ? { ...broker, ...dto } : broker));
      return this.persistBrokers(entity, oldBrokers, brokers, 'BROKER_UPDATE', session);
    });
  }

  async softDeleteBroker(propertyId: string, version: string, brokerId: string, expectedRevision: number): Promise<any> {
    return this.runInTransaction(async (session) => {
      const entity = await this.assertEditableVersion(propertyId, version, session);
      this.assertRevision(entity.revision, expectedRevision);

      const oldBrokers = await this.loadBrokers(entity, session);
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

      return this.persistBrokers(entity, oldBrokers, brokers, 'BROKER_DELETE_SOFT', session);
    });
  }

  private async loadBrokers(entity: any, session?: ClientSession): Promise<BrokerDto[]> {
    const persisted = await this.brokerRepository.listByPropertyVersionId(entity._id, session);
    if (persisted.length > 0) {
      return persisted.map((item) => this.stripMeta(item));
    }
    return Array.isArray(entity.brokers) ? entity.brokers : [];
  }

  private async persistBrokers(
    entity: any,
    oldBrokers: BrokerDto[],
    brokers: BrokerDto[],
    action: string,
    session?: ClientSession,
  ) {
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

    await this.brokerRepository.replaceByPropertyVersionId(entity._id, entity.propertyId, entity.version, brokers as any, session);
    const persisted = await this.brokerRepository.listByPropertyVersionId(entity._id, session);
    const normalizedBrokers = persisted.map((item) => this.stripMeta(item));

    const changes = buildDiff({ brokers: oldBrokers }, { brokers: normalizedBrokers });
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
      brokers: normalizedBrokers,
      tenants: (await this.tenantRepository.listByPropertyVersionId(entity._id, session)).map((item) => this.stripMeta(item)),
    };
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
