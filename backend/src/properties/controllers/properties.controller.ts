import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { SaveAsVersionDto } from '../dto/save-as-version.dto';
import { SavePropertyVersionDto } from '../dto/save-property-version.dto';
import { PropertiesService } from '../services/properties.service';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get(':propertyId/versions')
  listVersions(@Param('propertyId') propertyId: string) {
    return this.propertiesService.listVersions(propertyId);
  }

  @Get(':propertyId/versions/:version')
  getVersion(@Param('propertyId') propertyId: string, @Param('version') version: string) {
    return this.propertiesService.getVersion(propertyId, version);
  }

  @Get(':propertyId/versions/:version/audit-logs')
  listAudit(@Param('propertyId') propertyId: string, @Param('version') version: string) {
    return this.propertiesService.listAudit(propertyId, version);
  }

  @Put(':propertyId/versions/:version')
  saveCurrentVersion(
    @Param('propertyId') propertyId: string,
    @Param('version') version: string,
    @Body() dto: SavePropertyVersionDto,
  ): Promise<any> {
    return this.propertiesService.saveCurrentVersion(propertyId, version, dto);
  }

  @Post(':propertyId/versions/:version/save-as')
  saveAsNextVersion(
    @Param('propertyId') propertyId: string,
    @Param('version') version: string,
    @Body() dto: SaveAsVersionDto,
  ): Promise<any> {
    return this.propertiesService.saveAsNextVersion(propertyId, version, dto);
  }
}
