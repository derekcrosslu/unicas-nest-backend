import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'debug', 'log'],
  });
  const configService = app.get(ConfigService);
// 'app.enableDebugLogs();'

//claude.ai/chat/01eea9cb-10cd-44a3-9413-0b81cd6e6c28#:~:text=app.enableDebugLogs()%3B
// Enable CORS with specific configuration
https: app.enableCors({
  origin: [
    'https://unicas-frontend-production.up.railway.app',
    'https://unicas-frontend-dev.up.railway.app',
    'https://unicas-frontend-nuevaui.up.railway.app',
    'https://unicas-frontend-production-f12d.up.railway.app',
    'http://localhost:3001', // Frontend URL
    configService.get('FRONTEND_URL'),
  ],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
});
app.useLogger(['debug', 'error', 'log', 'verbose', 'warn']);
  // Increase JSON payload size limit
  app.use(json({ limit: '50mb' }));

  // Global prefix
  app.setGlobalPrefix('api');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Las Unicas API')
    .setDescription('API documentation for Las Unicas backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Start server
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/docs`);
}
bootstrap();
