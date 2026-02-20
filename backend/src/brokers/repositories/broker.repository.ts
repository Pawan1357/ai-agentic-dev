import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Broker, BrokerDocument } from '../schemas/broker.schema';

@Injectable()
export class BrokerRepository {
  constructor(@InjectModel(Broker.name) private readonly model: Model<BrokerDocument>) {}

  listByPropertyVersionId(propertyVersionId: Types.ObjectId | string) {
    return this.model
      .find({ propertyVersionId: new Types.ObjectId(String(propertyVersionId)) })
      .sort({ createdAt: 1, _id: 1 })
      .lean();
  }

  async replaceByPropertyVersionId(
    propertyVersionId: Types.ObjectId | string,
    propertyId: string,
    version: string,
    brokers: Array<Omit<Broker, 'propertyVersionId' | 'propertyId' | 'version'>>,
  ) {
    const propertyVersionObjectId = new Types.ObjectId(String(propertyVersionId));
    await this.model.deleteMany({ propertyVersionId: propertyVersionObjectId });
    if (brokers.length === 0) {
      return [];
    }
    return this.model.insertMany(
      brokers.map((broker) => ({
        ...broker,
        propertyVersionId: propertyVersionObjectId,
        propertyId,
        version,
      })),
    );
  }
}
