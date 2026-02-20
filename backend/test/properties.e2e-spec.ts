import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { ApiExceptionFilter } from '../src/common/filters/api-exception.filter';
import { HttpLoggingInterceptor } from '../src/common/interceptors/http-logging.interceptor';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { AppLoggerService } from '../src/common/logging/app-logger.service';

describe('PropertiesController (e2e)', () => {
  let app: INestApplication;
  let mongo: MongoMemoryServer;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongo.getUri('assessment_test');

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    const logger = app.get(AppLoggerService);
    app.useGlobalInterceptors(new HttpLoggingInterceptor(logger), new ResponseInterceptor());
    app.useGlobalFilters(new ApiExceptionFilter(logger));
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (mongo) {
      await mongo.stop({ doCleanup: true, force: true });
    }
  });

  it('returns seeded property', async () => {
    const response = await request(app.getHttpServer()).get('/api/properties/property-1/versions/1.1').expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.propertyId).toBe('property-1');
  });
});
  jest.setTimeout(30000);
