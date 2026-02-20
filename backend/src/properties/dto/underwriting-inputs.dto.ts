import { IsDateString, IsInt, IsNumber, IsPositive, Min } from 'class-validator';

export class UnderwritingInputsDto {
  @IsNumber()
  @Min(0)
  listPrice!: number;

  @IsNumber()
  @Min(0)
  bid!: number;

  @IsNumber()
  @Min(0)
  gpEquityStack!: number;

  @IsNumber()
  @Min(0)
  lpEquityStack!: number;

  @IsNumber()
  @Min(0)
  acqFee!: number;

  @IsNumber()
  @Min(0)
  amFee!: number;

  @IsNumber()
  @Min(0)
  promote!: number;

  @IsNumber()
  @Min(0)
  prefHurdle!: number;

  @IsNumber()
  @Min(0)
  propMgmtFee!: number;

  @IsDateString()
  estStartDate!: string;

  @IsInt()
  @IsPositive()
  holdPeriodYears!: number;

  @IsNumber()
  @Min(0)
  closingCostsPct!: number;

  @IsNumber()
  @Min(0)
  saleCostsPct!: number;

  @IsNumber()
  @Min(0)
  vacancyPct!: number;

  @IsNumber()
  @Min(0)
  annualCapexReservesPct!: number;

  @IsNumber()
  @Min(0)
  annualAdminExpPct!: number;

  @IsNumber()
  @Min(0)
  expenseInflationPct!: number;

  @IsNumber()
  @Min(0)
  exitCapRate!: number;
}
