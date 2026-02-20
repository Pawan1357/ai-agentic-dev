import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
export class UnderwritingInputsSchemaClass {
  @Prop({ required: true })
  listPrice!: number;

  @Prop({ required: true })
  bid!: number;

  @Prop({ required: true })
  gpEquityStack!: number;

  @Prop({ required: true })
  lpEquityStack!: number;

  @Prop({ required: true })
  acqFee!: number;

  @Prop({ required: true })
  amFee!: number;

  @Prop({ required: true })
  promote!: number;

  @Prop({ required: true })
  prefHurdle!: number;

  @Prop({ required: true })
  propMgmtFee!: number;

  @Prop({ required: true })
  estStartDate!: string;

  @Prop({ required: true })
  holdPeriodYears!: number;

  @Prop({ required: true })
  closingCostsPct!: number;

  @Prop({ required: true })
  saleCostsPct!: number;

  @Prop({ required: true })
  vacancyPct!: number;

  @Prop({ required: true })
  annualCapexReservesPct!: number;

  @Prop({ required: true })
  annualAdminExpPct!: number;

  @Prop({ required: true })
  expenseInflationPct!: number;

  @Prop({ required: true })
  exitCapRate!: number;
}
