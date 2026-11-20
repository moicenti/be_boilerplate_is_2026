import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import type { EnvConfig } from '@Config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService<EnvConfig, true>);

  // Número de saltos, no `true`: con `true` Express toma la IP más a la
  // izquierda de X-Forwarded-For, que la escribe el cliente y se falsifica.
  const proxyHops = configService.get('TRUST_PROXY_HOPS', { infer: true });
  if (proxyHops > 0) app.set('trust proxy', proxyHops);

  const corsOrigins = configService.get('CORS_ORIGINS', { infer: true });
  if (corsOrigins.length > 0) app.enableCors({ origin: corsOrigins });

  configureApp(app);

  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('SI Backend Boilerplate')
    .setDescription('API REST con autenticación por usuario y contraseña.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  const port = configService.get('PORT', { infer: true });
  await app.listen(port);
}

await bootstrap();
