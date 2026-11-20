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
import { Injectable, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcrypt';
/**
 * Hash descartable con el que se compara cuando el email no existe.
 *
 * Sin esto, un login contra un email no registrado respondería muchísimo más
 * rápido que uno contra una cuenta real (no habría bcrypt de por medio), y esa
 * diferencia de tiempo permite enumerar qué emails están registrados.
 * Corresponde a un valor aleatorio; nunca va a matchear.
 */
const DUMMY_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEe.7ttRFZIqjvBeT3M1kRDRm1gy9cKr9Wy';
let AuthService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AuthService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AuthService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        usersService;
        tokenService;
        constructor(usersService, tokenService) {
            this.usersService = usersService;
            this.tokenService = tokenService;
        }
        async login(dto) {
            const user = await this.validateCredentials(dto.email, dto.password);
            return { user, tokens: await this.tokenService.issueTokenPair(user) };
        }
        /**
         * Valida email y contraseña.
         *
         * Responde el mismo 401 genérico en los tres casos posibles (email no
         * registrado, contraseña incorrecta, cuenta inactiva) para no filtrar qué
         * emails tienen cuenta.
         */
        async validateCredentials(email, password) {
            const user = await this.usersService.findByEmail(email);
            if (!user) {
                await bcrypt.compare(password, DUMMY_HASH);
                throw new UnauthorizedException('Credenciales inválidas.');
            }
            const passwordMatches = await this.usersService.verifyPassword(password, user.passwordHash);
            if (!passwordMatches || !user.isActive) {
                throw new UnauthorizedException('Credenciales inválidas.');
            }
            return user;
        }
        refresh(refreshToken) {
            return this.tokenService.rotate(refreshToken);
        }
        logout(refreshToken) {
            return this.tokenService.revoke(refreshToken);
        }
    };
    return AuthService = _classThis;
})();
export { AuthService };
