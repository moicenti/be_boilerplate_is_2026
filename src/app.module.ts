import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule, minutes } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from '@Auth';
import { JwtAuthGuard, RolesGuard } from '@Auth/guards';
import { HealthModule } from '@Health';
import { PrismaModule } from '@Prisma';
import { UsersModule } from '@Users';
import { validateEnv, type EnvConfig } from '@Config';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificacionesModule } from '@Notificaciones';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { IncidenciasModule } from '@Incidencias';
import { UnidadesModule } from '@Unidades';
import { PaquetesModule } from '@Paquetes';
import { AsambleasModule } from '@Asambleas';
import { CommonAreasModule } from '@CommonAreas';
import { ReservasModule } from '@Reservas';
import { CuotasModule } from '@Cuotas';
import { PagosModule } from '@Pagos';
import { AnunciosModule } from './anuncio/index.js';
import { VisitasModule } from '@Visitas';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // Si falta DATABASE_URL o JWT_SECRET, la app no arranca.
      validate: validateEnv,
    }),
    // Límite general por IP. Las rutas sensibles (login, registro) lo bajan
    // con @Throttle. Memoria local: alcanza con una sola instancia.
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvConfig, true>) => ({
        throttlers: [{ name: 'default', ttl: minutes(1), limit: 300 }],
        errorMessage: 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.',
        // Los e2e inician sesión decenas de veces desde la misma IP.
        skipIf: () => config.get('NODE_ENV', { infer: true }) === 'test',
      }),
    }),
    PrismaModule,
    HealthModule,
    UsersModule,
    AuthModule,
    IncidenciasModule,
    UnidadesModule,
    PaquetesModule,
    AsambleasModule,
    CommonAreasModule,
    VisitasModule,
    ReservasModule,
    CuotasModule,
    PagosModule,
    ServeStaticModule.forRoot({
   rootPath: join(process.cwd(), 'uploads'),
    serveRoot: '/uploads',
    serveStaticOptions: {
      index: false,
      fallthrough: false,
      setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'");
    },
  },
}),
    ScheduleModule.forRoot(),
    NotificacionesModule,
    AnunciosModule,
  ],
  providers: [
    {
      // Primero: corta los excesos antes de verificar el JWT o tocar la base.
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      // Todo cerrado por defecto: las rutas públicas se abren con @Public().
      provide: APP_GUARD,
      useExisting: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useExisting: RolesGuard,
    },
  ],
})
export class AppModule {}
