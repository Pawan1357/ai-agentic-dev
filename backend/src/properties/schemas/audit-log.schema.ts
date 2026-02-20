import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ _id: false })
class AuditChange {
  @Prop({ required: true })
  field!: string;

  @Prop({ type: Object })
  oldValue!: unknown;

  @Prop({ type: Object })
  newValue!: unknown;
}

@Schema({ collection: 'audit_logs', timestamps: true })
export class AuditLog {
  @Prop({ required: true })
  propertyId!: string;

  @Prop({ required: true })
  version!: string;

  @Prop({ required: true })
  revision!: number;

  @Prop({ required: true })
  updatedBy!: string;

  @Prop({ required: true })
  action!: string;

  @Prop({ type: [AuditChange], default: [] })
  changes!: AuditChange[];

  @Prop({ required: true })
  changedFieldCount!: number;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
