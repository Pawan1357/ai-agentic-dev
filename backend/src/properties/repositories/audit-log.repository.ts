import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from '../schemas/audit-log.schema';

@Injectable()
export class AuditLogRepository {
  constructor(@InjectModel(AuditLog.name) private readonly model: Model<AuditLogDocument>) {}

  async create(payload: Partial<AuditLog>, session?: ClientSession) {
    const [created] = await this.model.create([payload], { session });
    return created;
  }

  list(propertyId: string, version: string) {
    return this.model.find({ propertyId, version }).sort({ createdAt: -1 }).lean();
  }
}
