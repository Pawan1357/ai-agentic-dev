import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BrokerDocument = HydratedDocument<Broker>;

@Schema({ collection: 'brokers', timestamps: true })
export class Broker {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  propertyVersionId!: Types.ObjectId;

  @Prop({ required: true, index: true })
  propertyId!: string;

  @Prop({ required: true, index: true })
  version!: string;

  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  phone!: string;

  @Prop({ required: true })
  email!: string;

  @Prop({ required: true })
  company!: string;

  @Prop({ required: true })
  isDeleted!: boolean;

  @Prop()
  deletedAt?: string;

  @Prop()
  deletedBy?: string;
}

export const BrokerSchema = SchemaFactory.createForClass(Broker);
BrokerSchema.index({ propertyVersionId: 1, id: 1 }, { unique: true });
