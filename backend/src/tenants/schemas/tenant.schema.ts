import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TenantDocument = HydratedDocument<Tenant>;

@Schema({ collection: 'tenants', timestamps: true })
export class Tenant {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  propertyVersionId!: Types.ObjectId;

  @Prop({ required: true, index: true })
  propertyId!: string;

  @Prop({ required: true, index: true })
  version!: string;

  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  tenantName!: string;

  @Prop({ required: true })
  creditType!: string;

  @Prop({ required: true })
  squareFeet!: number;

  @Prop({ required: true })
  rentPsf!: number;

  @Prop({ required: true })
  annualEscalations!: number;

  @Prop({ required: true })
  leaseStart!: string;

  @Prop({ required: true })
  leaseEnd!: string;

  @Prop({ required: true })
  leaseType!: string;

  @Prop({ required: true })
  renew!: string;

  @Prop({ required: true })
  downtimeMonths!: number;

  @Prop({ required: true })
  tiPsf!: number;

  @Prop({ required: true })
  lcPsf!: number;

  @Prop({ required: true })
  isVacant!: boolean;

  @Prop({ required: true })
  isDeleted!: boolean;

  @Prop()
  deletedAt?: string;

  @Prop()
  deletedBy?: string;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
TenantSchema.index({ propertyVersionId: 1, id: 1 }, { unique: true });
