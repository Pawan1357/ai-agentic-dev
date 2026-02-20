import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BrokersModule } from './brokers/brokers.module';
import { RolesGuard } from './common/auth/roles.guard';
import { AppLoggerService } from './common/logging/app-logger.service';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';
import { validateEnvironment } from './config/environment.validation';
import { PropertiesModule } from './properties/properties.module';
import { TenantsModule } from './tenants/tenants.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    MongooseModule.forRoot(process.env.MONGODB_URI ?? 'mongodb://localhost:27017/assessment'),
    PropertiesModule,
    BrokersModule,
    TenantsModule,
  ],
  providers: [
    AppLoggerService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(SecurityHeadersMiddleware, RateLimitMiddleware).forRoutes('*');
  }
}
