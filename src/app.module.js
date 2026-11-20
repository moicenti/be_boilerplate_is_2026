var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from '@Auth';
import { JwtAuthGuard, RolesGuard } from '@Auth/guards';
import { HealthModule } from '@Health';
import { PrismaModule } from '@Prisma';
import { UsersModule } from '@Users';
import { validateEnv } from '@Config';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificacionesModule } from '@Notificaciones';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { IncidenciasModule } from './incidencias/incidencias.module.js';
import { UnidadesModule } from '@Unidades';
import { PaquetesModule } from '@Paquetes';
import { CommonAreasModule } from '@CommonAreas';
import { AnunciosModule } from './anuncio/index.js';
let AppModule = (() => {
    let _classDecorators = [Module({
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    cache: true,
                    // Si falta DATABASE_URL o JWT_SECRET, la app no arranca.
                    validate: validateEnv,
                }),
                PrismaModule,
                HealthModule,
                UsersModule,
                AuthModule,
                IncidenciasModule,
                UnidadesModule,
                PaquetesModule,
                CommonAreasModule,
                ServeStaticModule.forRoot({
                    rootPath: join(process.cwd(), 'uploads'),
                    serveRoot: '/uploads',
                }),
                ScheduleModule.forRoot(),
                NotificacionesModule,
                AnunciosModule,
            ],
            providers: [
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
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AppModule = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AppModule = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return AppModule = _classThis;
})();
export { AppModule };
