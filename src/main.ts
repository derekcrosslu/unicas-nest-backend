import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { json } from 'express';
import { ClerkGuard } from './auth/guards/clerk.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable CORS with more permissive settings for development
  app.enableCors({
    origin: [
      configService.get('FRONTEND_URL'),
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
  });

  // Increase JSON payload size limit
  app.use(json({ limit: '50mb' }));

  // Global prefix
  app.setGlobalPrefix('api');

  // Global guards
  const clerkGuard = app.get(ClerkGuard);
  app.useGlobalGuards(clerkGuard);

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Request logging middleware
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`, {
      headers: {
        origin: req.headers.origin,
        'content-type': req.headers['content-type'],
        authorization: req.headers.authorization
          ? 'Bearer [hidden]'
          : undefined,
      },
    });
    next();
  });

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
