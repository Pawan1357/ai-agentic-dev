import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from '../schemas/audit-log.schema';

@Injectable()
export class AuditLogRepository {
  constructor(@InjectModel(AuditLog.name) private readonly model: Model<AuditLogDocument>) {}

  create(payload: Partial<AuditLog>) {
    return this.model.create(payload);
  }

  list(propertyId: string, version: string) {
    return this.model.find({ propertyId, version }).sort({ createdAt: -1 }).lean();
  }
}
