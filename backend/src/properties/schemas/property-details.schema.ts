import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
export class PropertyDetailsSchemaClass {
  @Prop({ required: true })
  address!: string;

  @Prop({ required: true })
  market!: string;

  @Prop({ required: true })
  subMarket!: string;

  @Prop({ required: true })
  propertyType!: string;

  @Prop({ required: true })
  propertySubType!: string;

  @Prop({ required: true })
  zoning!: string;

  @Prop({ required: true })
  zoningDetails!: string;

  @Prop({ required: true })
  listingType!: string;

  @Prop({ required: true })
  businessPlan!: string;

  @Prop({ required: true })
  sellerType!: string;

  @Prop({ required: true })
  lastTradePrice!: number;

  @Prop({ required: true })
  lastTradeDate!: string;

  @Prop({ required: true })
  askingPrice!: number;

  @Prop({ required: true })
  bidAmount!: number;

  @Prop({ required: true })
  yearOneCapRate!: number;

  @Prop({ required: true })
  stabilizedCapRate!: number;

  @Prop({ required: true })
  vintage!: number;

  @Prop({ required: true })
  buildingSizeSf!: number;

  @Prop({ required: true })
  warehouseSf!: number;

  @Prop({ required: true })
  officeSf!: number;

  @Prop({ required: true })
  propertySizeAcres!: number;

  @Prop({ required: true })
  coverageRatio!: number;

  @Prop({ required: true })
  outdoorStorage!: string;

  @Prop({ required: true })
  constructionType!: string;

  @Prop({ required: true })
  clearHeightFt!: number;

  @Prop({ required: true })
  dockDoors!: number;

  @Prop({ required: true })
  driveInDoors!: number;

  @Prop({ required: true })
  heavyPower!: string;

  @Prop({ required: true })
  sprinklerType!: string;
}
