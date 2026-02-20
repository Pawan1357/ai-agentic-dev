import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Tenant, TenantDocument } from '../schemas/tenant.schema';

@Injectable()
export class TenantRepository {
  constructor(@InjectModel(Tenant.name) private readonly model: Model<TenantDocument>) {}

  listByPropertyVersionId(propertyVersionId: Types.ObjectId | string, session?: ClientSession) {
    return this.model
      .find({ propertyVersionId: new Types.ObjectId(String(propertyVersionId)) })
      .session(session ?? null)
      .sort({ createdAt: 1, _id: 1 })
      .lean();
  }

  async replaceByPropertyVersionId(
    propertyVersionId: Types.ObjectId | string,
    propertyId: string,
    version: string,
    tenants: Array<Omit<Tenant, 'propertyVersionId' | 'propertyId' | 'version'>>,
    session?: ClientSession,
  ) {
    const propertyVersionObjectId = new Types.ObjectId(String(propertyVersionId));
    await this.model.deleteMany({ propertyVersionId: propertyVersionObjectId }, { session });
    if (tenants.length === 0) {
      return [];
    }
    return this.model.insertMany(
      tenants.map((tenant) => ({
        ...tenant,
        propertyVersionId: propertyVersionObjectId,
        propertyId,
        version,
      })),
      { session },
    );
  }
}
