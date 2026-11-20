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
import { Injectable, UnauthorizedException, } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
/**
 * Guard global: valida el Bearer token y carga el usuario en el request.
 *
 * Se implementa a mano en vez de usar Passport porque `passport-jwt` es CJS y
 * su interoperabilidad con ESM estricto es frágil. El costo es unas pocas
 * líneas y se gana control sobre el mensaje de error.
 *
 * Importa los decoradores por ruta relativa y no por `@Auth/decorators` para
 * no crear un ciclo entre los barrels de guards/ y decorators/.
 */
let JwtAuthGuard = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var JwtAuthGuard = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            JwtAuthGuard = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        reflector;
        jwtService;
        usersService;
        constructor(reflector, jwtService, usersService) {
            this.reflector = reflector;
            this.jwtService = jwtService;
            this.usersService = usersService;
        }
        async canActivate(context) {
            const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
                context.getHandler(),
                context.getClass(),
            ]);
            if (isPublic)
                return true;
            const request = context.switchToHttp().getRequest();
            const token = this.extractBearerToken(request.headers.authorization);
            if (!token) {
                throw new UnauthorizedException('Falta el token de acceso.');
            }
            let payload;
            try {
                payload = await this.jwtService.verifyAsync(token);
            }
            catch {
                // Cubre firma inválida, token expirado y token malformado por igual:
                // no conviene decirle al cliente cuál de los tres fue.
                throw new UnauthorizedException('Token de acceso inválido o expirado.');
            }
            // Se relee el usuario en cada request para que una cuenta desactivada o
            // eliminada deje de funcionar sin esperar a que expire el token.
            const user = await this.usersService.findById(payload.sub);
            if (!user || !user.isActive) {
                throw new UnauthorizedException('La cuenta no existe o está inactiva.');
            }
            request.user = user;
            return true;
        }
        extractBearerToken(header) {
            if (!header)
                return null;
            const [scheme, token] = header.split(' ');
            return scheme?.toLowerCase() === 'bearer' && token ? token : null;
        }
    };
    return JwtAuthGuard = _classThis;
})();
export { JwtAuthGuard };
