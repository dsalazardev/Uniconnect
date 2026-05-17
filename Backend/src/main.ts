import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

export function buildSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('Uniconnect API')
    .setDescription(
      'Documentación oficial de la API REST de Uniconnect — red social universitaria.\n\n' +
      'Todos los endpoints protegidos requieren un JWT Bearer token obtenido en `POST /api/auth/callback`.\n\n' +
      '**OpenAPI JSON**: `GET /docs-json`  |  **OpenAPI YAML**: `GET /docs-yaml`',
    )
    .setVersion(process.env.npm_package_version ?? '1.0.0')
    .addServer(`http://localhost:${process.env.PORT ?? 8007}`, 'Desarrollo local')
    .addServer('https://uniconnect-backend.fly.dev', 'Producción (Fly.io)')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .setContact('Uniconnect Team', '', 'luma1017hl@gmail.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .build();
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 8007;

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const document = SwaggerModule.createDocument(app, buildSwaggerConfig());
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Uniconnect API Docs',
  });

  await app.listen(port, '0.0.0.0');
}
bootstrap();
