import { Body, Controller, Delete, HttpCode, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { UpsertBrokerDto } from '../dto/broker.dto';
import { BrokersService } from '../services/brokers.service';

@Controller('properties')
export class BrokersController {
  constructor(private readonly brokersService: BrokersService) {}

  @Post(':propertyId/versions/:version/brokers')
  createBroker(
    @Param('propertyId') propertyId: string,
    @Param('version') version: string,
    @Query('expectedRevision', ParseIntPipe) expectedRevision: number,
    @Body() dto: UpsertBrokerDto,
  ): Promise<any> {
    return this.brokersService.createBroker(propertyId, version, expectedRevision, dto);
  }

  @Put(':propertyId/versions/:version/brokers/:brokerId')
  updateBroker(
    @Param('propertyId') propertyId: string,
    @Param('version') version: string,
    @Param('brokerId') brokerId: string,
    @Query('expectedRevision', ParseIntPipe) expectedRevision: number,
    @Body() dto: UpsertBrokerDto,
  ): Promise<any> {
    return this.brokersService.updateBroker(propertyId, version, brokerId, expectedRevision, dto);
  }

  @Delete(':propertyId/versions/:version/brokers/:brokerId')
  @HttpCode(200)
  softDeleteBroker(
    @Param('propertyId') propertyId: string,
    @Param('version') version: string,
    @Param('brokerId') brokerId: string,
    @Query('expectedRevision', ParseIntPipe) expectedRevision: number,
  ): Promise<any> {
    return this.brokersService.softDeleteBroker(propertyId, version, brokerId, expectedRevision);
  }
}
