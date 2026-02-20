import { Module } from '@nestjs/common';
import { PropertiesModule } from '../properties/properties.module';
import { TenantsController } from './controllers/tenants.controller';
import { TenantsService } from './services/tenants.service';

@Module({
  imports: [PropertiesModule],
  controllers: [TenantsController],
  providers: [TenantsService],
})
export class TenantsModule {}
