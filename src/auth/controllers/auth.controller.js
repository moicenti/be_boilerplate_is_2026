var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
import { Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse, } from '@nestjs/swagger';
import { Public } from '@Auth/decorators';
import { AuthResponseDto } from '@Auth/dto';
import { UserResponseDto } from '@Users/dto';
let AuthController = (() => {
    let _classDecorators = [ApiTags('auth'), Controller('auth')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _login_decorators;
    let _refresh_decorators;
    let _logout_decorators;
    let _me_decorators;
    var AuthController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _login_decorators = [Public(), Post('login'), HttpCode(HttpStatus.OK), ApiOperation({ summary: 'Inicia sesión con usuario y contraseña' }), ApiOkResponse({ type: AuthResponseDto }), ApiUnauthorizedResponse({ description: 'Credenciales inválidas.' })];
            _refresh_decorators = [Public(), Post('refresh'), HttpCode(HttpStatus.OK), ApiOperation({ summary: 'Renueva el access token rotando el refresh token' }), ApiOkResponse({ type: AuthResponseDto }), ApiUnauthorizedResponse({ description: 'Refresh token inválido, expirado o ya utilizado.' })];
            _logout_decorators = [Public(), Post('logout'), HttpCode(HttpStatus.NO_CONTENT), ApiOperation({ summary: 'Cierra la sesión revocando el refresh token' }), ApiNoContentResponse({ description: 'Sesión cerrada.' })];
            _me_decorators = [Get('me'), ApiBearerAuth(), ApiOperation({ summary: 'Devuelve el usuario autenticado' }), ApiOkResponse({ type: UserResponseDto }), ApiUnauthorizedResponse({ description: 'Token ausente, inválido o expirado.' })];
            __esDecorate(this, null, _login_decorators, { kind: "method", name: "login", static: false, private: false, access: { has: obj => "login" in obj, get: obj => obj.login }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _refresh_decorators, { kind: "method", name: "refresh", static: false, private: false, access: { has: obj => "refresh" in obj, get: obj => obj.refresh }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _logout_decorators, { kind: "method", name: "logout", static: false, private: false, access: { has: obj => "logout" in obj, get: obj => obj.logout }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _me_decorators, { kind: "method", name: "me", static: false, private: false, access: { has: obj => "me" in obj, get: obj => obj.me }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AuthController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        authService = __runInitializers(this, _instanceExtraInitializers);
        constructor(authService) {
            this.authService = authService;
        }
        /**
         * Login. Responde 200 y no 201: no se crea un recurso direccionable, se
         * devuelve una representación de la sesión. Nest usa 201 por defecto en
         * POST, de ahí el @HttpCode explícito.
         */
        async login(dto) {
            const { user, tokens } = await this.authService.login(dto);
            return AuthResponseDto.from(user, tokens);
        }
        /** Canjea el refresh token por un par nuevo. El token viejo queda revocado. */
        async refresh(dto) {
            const { user, tokens } = await this.authService.refresh(dto.refreshToken);
            return AuthResponseDto.from(user, tokens);
        }
        /** Logout. 204 porque no hay cuerpo que devolver. */
        async logout(dto) {
            await this.authService.logout(dto.refreshToken);
        }
        /** Usuario autenticado. Protegido por el guard global. */
        me(user) {
            return UserResponseDto.fromEntity(user);
        }
    };
    return AuthController = _classThis;
})();
export { AuthController };
