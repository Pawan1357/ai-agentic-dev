import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { PropertyDetailsSchemaClass } from './property-details.schema';
import { UnderwritingInputsSchemaClass } from './underwriting-inputs.schema';

export type PropertyVersionDocument = HydratedDocument<PropertyVersion>;

@Schema({ collection: 'property_versions', timestamps: true })
export class PropertyVersion {
  @Prop({ required: true, index: true })
  propertyId!: string;

  @Prop({ required: true })
  version!: string;

  @Prop({ required: true })
  isLatest!: boolean;

  @Prop({ required: true })
  isHistorical!: boolean;

  @Prop({ required: true })
  revision!: number;

  @Prop({ type: PropertyDetailsSchemaClass, required: true })
  propertyDetails!: PropertyDetailsSchemaClass;

  @Prop({ type: UnderwritingInputsSchemaClass, required: true })
  underwritingInputs!: UnderwritingInputsSchemaClass;

  @Prop({ required: true })
  updatedBy!: string;
}

export const PropertyVersionSchema = SchemaFactory.createForClass(PropertyVersion);
PropertyVersionSchema.index({ propertyId: 1, version: 1 }, { unique: true });
