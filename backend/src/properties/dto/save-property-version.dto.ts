import { Type } from 'class-transformer';
import { IsArray, IsInt, Min, ValidateNested } from 'class-validator';
import { BrokerDto } from '../../brokers/dto/broker.dto';
import { TenantDto } from '../../tenants/dto/tenant.dto';
import { PropertyDetailsDto } from './property-details.dto';
import { UnderwritingInputsDto } from './underwriting-inputs.dto';

export class SavePropertyVersionDto {
  @IsInt()
  @Min(0)
  expectedRevision!: number;

  @ValidateNested()
  @Type(() => PropertyDetailsDto)
  propertyDetails!: PropertyDetailsDto;

  @ValidateNested()
  @Type(() => UnderwritingInputsDto)
  underwritingInputs!: UnderwritingInputsDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BrokerDto)
  brokers!: BrokerDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TenantDto)
  tenants!: TenantDto[];
}
