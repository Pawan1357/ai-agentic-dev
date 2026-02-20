import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { PropertyVersion, PropertyVersionDocument } from '../schemas/property-version.schema';

@Injectable()
export class PropertyRepository {
  constructor(@InjectModel(PropertyVersion.name) private readonly model: Model<PropertyVersionDocument>) {}

  findOne(propertyId: string, version: string, session?: ClientSession) {
    return this.model.findOne({ propertyId, version }).session(session ?? null).lean();
  }

  async create(payload: Partial<PropertyVersion>, session?: ClientSession) {
    const [created] = await this.model.create([payload], { session });
    return created;
  }

  markLatestAsHistorical(propertyId: string, session?: ClientSession) {
    return this.model.updateMany({ propertyId, isLatest: true }, { isLatest: false, isHistorical: true }, { session });
  }

  saveCurrentVersionAtomic(
    propertyId: string,
    version: string,
    expectedRevision: number,
    payload: Partial<PropertyVersion>,
    session?: ClientSession,
  ) {
    return this.model.findOneAndUpdate(
      { propertyId, version, revision: expectedRevision, isHistorical: false },
      { $set: payload, $inc: { revision: 1 } },
      { new: true, runValidators: true, context: 'query', session },
    );
  }

  listVersions(propertyId: string, session?: ClientSession) {
    return this.model
      .find({ propertyId })
      .session(session ?? null)
      .select({ propertyId: 1, version: 1, revision: 1, isLatest: 1, isHistorical: 1, updatedBy: 1, updatedAt: 1 })
      .sort({ updatedAt: -1 })
      .lean();
  }
}
