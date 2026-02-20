import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { BrokerDto } from '../../brokers/dto/broker.dto';
import { TenantDto } from '../../tenants/dto/tenant.dto';
import { PropertyDetailsDto } from './property-details.dto';
import { UnderwritingInputsDto } from './underwriting-inputs.dto';

export class SaveAsVersionDto {
  @IsInt()
  @Min(0)
  expectedRevision!: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PropertyDetailsDto)
  propertyDetails?: PropertyDetailsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UnderwritingInputsDto)
  underwritingInputs?: UnderwritingInputsDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BrokerDto)
  brokers?: BrokerDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TenantDto)
  tenants?: TenantDto[];
}
