import { Module } from '@nestjs/common';
import { PropertiesModule } from '../properties/properties.module';
import { BrokersController } from './controllers/brokers.controller';
import { BrokersService } from './services/brokers.service';

@Module({
  imports: [PropertiesModule],
  controllers: [BrokersController],
  providers: [BrokersService],
})
export class BrokersModule {}
