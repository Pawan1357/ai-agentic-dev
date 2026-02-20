import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PropertiesController } from './controllers/properties.controller';
import { PropertiesService } from './services/properties.service';
import { PropertySeedService } from './services/property-seed.service';
import { PropertyRepository } from './repositories/property.repository';
import { AuditLogRepository } from './repositories/audit-log.repository';
import { PropertyVersion, PropertyVersionSchema } from './schemas/property-version.schema';
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema';
import { Broker, BrokerSchema } from '../brokers/schemas/broker.schema';
import { Tenant, TenantSchema } from '../tenants/schemas/tenant.schema';
import { BrokerRepository } from '../brokers/repositories/broker.repository';
import { TenantRepository } from '../tenants/repositories/tenant.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PropertyVersion.name, schema: PropertyVersionSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: Broker.name, schema: BrokerSchema },
      { name: Tenant.name, schema: TenantSchema },
    ]),
  ],
  controllers: [PropertiesController],
  providers: [PropertiesService, PropertySeedService, PropertyRepository, AuditLogRepository, BrokerRepository, TenantRepository],
  exports: [PropertiesService, PropertyRepository, AuditLogRepository, BrokerRepository, TenantRepository],
})
export class PropertiesModule {}
