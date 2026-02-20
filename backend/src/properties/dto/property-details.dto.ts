import { IsDateString, IsInt, IsNumber, IsString, Min } from 'class-validator';

export class PropertyDetailsDto {
  @IsString()
  address!: string;

  @IsString()
  market!: string;

  @IsString()
  subMarket!: string;

  @IsString()
  propertyType!: string;

  @IsString()
  propertySubType!: string;

  @IsString()
  zoning!: string;

  @IsString()
  zoningDetails!: string;

  @IsString()
  listingType!: string;

  @IsString()
  businessPlan!: string;

  @IsString()
  sellerType!: string;

  @IsNumber()
  @Min(0)
  lastTradePrice!: number;

  @IsDateString()
  lastTradeDate!: string;

  @IsNumber()
  @Min(0)
  askingPrice!: number;

  @IsNumber()
  @Min(0)
  bidAmount!: number;

  @IsNumber()
  yearOneCapRate!: number;

  @IsNumber()
  stabilizedCapRate!: number;

  @IsInt()
  vintage!: number;

  @IsNumber()
  @Min(0)
  buildingSizeSf!: number;

  @IsNumber()
  @Min(0)
  warehouseSf!: number;

  @IsNumber()
  @Min(0)
  officeSf!: number;

  @IsNumber()
  @Min(0)
  propertySizeAcres!: number;

  @IsNumber()
  @Min(0)
  coverageRatio!: number;

  @IsString()
  outdoorStorage!: string;

  @IsString()
  constructionType!: string;

  @IsNumber()
  @Min(0)
  clearHeightFt!: number;

  @IsInt()
  @Min(0)
  dockDoors!: number;

  @IsInt()
  @Min(0)
  driveInDoors!: number;

  @IsString()
  heavyPower!: string;

  @IsString()
  sprinklerType!: string;
}
