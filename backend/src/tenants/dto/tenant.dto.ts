import { IsBoolean, IsDateString, IsInt, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class TenantDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  tenantName!: string;

  @IsString()
  creditType!: string;

  @IsNumber()
  @Min(0)
  squareFeet!: number;

  @IsNumber()
  @Min(0)
  rentPsf!: number;

  @IsNumber()
  @Min(0)
  annualEscalations!: number;

  @IsDateString()
  leaseStart!: string;

  @IsDateString()
  leaseEnd!: string;

  @IsString()
  leaseType!: string;

  @IsString()
  renew!: string;

  @IsInt()
  @Min(0)
  downtimeMonths!: number;

  @IsNumber()
  @Min(0)
  tiPsf!: number;

  @IsNumber()
  @Min(0)
  lcPsf!: number;

  @IsBoolean()
  isVacant!: boolean;

  @IsBoolean()
  isDeleted!: boolean;
}

export class UpsertTenantDto {
  @IsString()
  @IsNotEmpty()
  tenantName!: string;

  @IsString()
  creditType!: string;

  @IsNumber()
  @Min(0)
  squareFeet!: number;

  @IsNumber()
  @Min(0)
  rentPsf!: number;

  @IsNumber()
  @Min(0)
  annualEscalations!: number;

  @IsDateString()
  leaseStart!: string;

  @IsDateString()
  leaseEnd!: string;

  @IsString()
  leaseType!: string;

  @IsString()
  renew!: string;

  @IsInt()
  @Min(0)
  downtimeMonths!: number;

  @IsNumber()
  @Min(0)
  tiPsf!: number;

  @IsNumber()
  @Min(0)
  lcPsf!: number;
}
