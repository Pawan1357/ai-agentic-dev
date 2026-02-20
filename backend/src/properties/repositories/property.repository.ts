import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PropertyVersion, PropertyVersionDocument } from '../schemas/property-version.schema';

@Injectable()
export class PropertyRepository {
  constructor(@InjectModel(PropertyVersion.name) private readonly model: Model<PropertyVersionDocument>) {}

  findOne(propertyId: string, version: string) {
    return this.model.findOne({ propertyId, version }).lean();
  }

  create(payload: Partial<PropertyVersion>) {
    return this.model.create(payload);
  }

  markLatestAsHistorical(propertyId: string) {
    return this.model.updateMany({ propertyId, isLatest: true }, { isLatest: false, isHistorical: true });
  }

  saveCurrentVersionAtomic(propertyId: string, version: string, expectedRevision: number, payload: Partial<PropertyVersion>) {
    return this.model.findOneAndUpdate(
      { propertyId, version, revision: expectedRevision, isHistorical: false },
      { $set: payload, $inc: { revision: 1 } },
      { new: true, runValidators: true, context: 'query' },
    );
  }

  listVersions(propertyId: string) {
    return this.model
      .find({ propertyId })
      .select({ propertyId: 1, version: 1, revision: 1, isLatest: 1, isHistorical: 1, updatedBy: 1, updatedAt: 1 })
      .sort({ updatedAt: -1 })
      .lean();
  }
}
