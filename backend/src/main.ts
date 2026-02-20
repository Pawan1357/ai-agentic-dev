import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { HttpLoggingInterceptor } from './common/interceptors/http-logging.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AppLoggerService } from './common/logging/app-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appLogger = app.get(AppLoggerService);
  app.useLogger(appLogger);
  const configService = app.get(ConfigService);
  app.use(helmet());
  app.enableCors({
    origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: true,
    }),
  );
  app.useGlobalInterceptors(new HttpLoggingInterceptor(appLogger), new ResponseInterceptor());
  app.useGlobalFilters(new ApiExceptionFilter(appLogger));
  await app.listen(configService.get<number>('PORT', 3000));
}

bootstrap();
