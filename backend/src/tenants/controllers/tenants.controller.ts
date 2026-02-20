import { Body, Controller, Delete, HttpCode, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { UpsertTenantDto } from '../dto/tenant.dto';
import { TenantsService } from '../services/tenants.service';

@Controller('properties')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post(':propertyId/versions/:version/tenants')
  createTenant(
    @Param('propertyId') propertyId: string,
    @Param('version') version: string,
    @Query('expectedRevision', ParseIntPipe) expectedRevision: number,
    @Body() dto: UpsertTenantDto,
  ): Promise<any> {
    return this.tenantsService.createTenant(propertyId, version, expectedRevision, dto);
  }

  @Put(':propertyId/versions/:version/tenants/:tenantId')
  updateTenant(
    @Param('propertyId') propertyId: string,
    @Param('version') version: string,
    @Param('tenantId') tenantId: string,
    @Query('expectedRevision', ParseIntPipe) expectedRevision: number,
    @Body() dto: UpsertTenantDto,
  ): Promise<any> {
    return this.tenantsService.updateTenant(propertyId, version, tenantId, expectedRevision, dto);
  }

  @Delete(':propertyId/versions/:version/tenants/:tenantId')
  @HttpCode(200)
  softDeleteTenant(
    @Param('propertyId') propertyId: string,
    @Param('version') version: string,
    @Param('tenantId') tenantId: string,
    @Query('expectedRevision', ParseIntPipe) expectedRevision: number,
  ): Promise<any> {
    return this.tenantsService.softDeleteTenant(propertyId, version, tenantId, expectedRevision);
  }
}
