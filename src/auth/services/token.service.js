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
import { createHash, randomBytes } from 'node:crypto';
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const REFRESH_TOKEN_BYTES = 32;
/**
 * Emisión, rotación y revocación de tokens.
 *
 * El access token es un JWT de vida corta y sin estado. El refresh token es un
 * string opaco persistido: se guarda su SHA-256, no el valor en claro.
 *
 * Por qué SHA-256 y no bcrypt para el refresh token: son 32 bytes aleatorios,
 * es decir alta entropía, así que no hay un espacio de búsqueda que un KDF
 * lento deba encarecer. Además hace falta buscarlo por hash en un índice
 * (bcrypt genera un salt distinto por hash, así que no se puede indexar) y
 * bcrypt trunca en 72 bytes. bcrypt queda para las contraseñas, que sí son de
 * baja entropía.
 */
let TokenService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var TokenService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TokenService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        refreshTokenRepository;
        jwtService;
        refreshTokenTtlMs;
        constructor(refreshTokenRepository, jwtService, configService) {
            this.refreshTokenRepository = refreshTokenRepository;
            this.jwtService = jwtService;
            this.refreshTokenTtlMs =
                configService.get('REFRESH_TOKEN_EXPIRES_IN_DAYS', { infer: true }) *
                    MILLISECONDS_PER_DAY;
        }
        /** Emite un par de tokens nuevo y persiste el refresh token. */
        async issueTokenPair(user) {
            const payload = {
                sub: user.id,
                email: user.email,
            };
            const accessToken = await this.jwtService.signAsync(payload);
            const refreshToken = randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
            await this.refreshTokenRepository.create({
                tokenHash: this.hashToken(refreshToken),
                userId: user.id,
                expiresAt: new Date(Date.now() + this.refreshTokenTtlMs),
            });
            return {
                accessToken,
                refreshToken,
                expiresIn: await this.getAccessTokenTtlSeconds(accessToken),
            };
        }
        /**
         * Canjea un refresh token por un par nuevo (rotación).
         *
         * Incluye detección de reúso: si llega un token que ya fue canjeado, se
         * asume que fue robado y se revoca la sesión completa del usuario.
         */
        async rotate(refreshToken) {
            const stored = await this.refreshTokenRepository.findByTokenHashWithUser(this.hashToken(refreshToken));
            if (!stored) {
                throw new UnauthorizedException('Refresh token inválido.');
            }
            if (stored.revokedAt !== null) {
                await this.refreshTokenRepository.revokeAllForUser(stored.userId);
                throw new UnauthorizedException('Refresh token ya utilizado. Se cerraron todas las sesiones por seguridad.');
            }
            if (stored.expiresAt.getTime() <= Date.now()) {
                throw new UnauthorizedException('Refresh token expirado.');
            }
            if (!stored.user.isActive) {
                throw new UnauthorizedException('La cuenta está inactiva.');
            }
            await this.refreshTokenRepository.revokeById(stored.id);
            return {
                user: stored.user,
                tokens: await this.issueTokenPair(stored.user),
            };
        }
        /**
         * Revoca un refresh token puntual (logout).
         *
         * Es idempotente a propósito: un logout con un token ya inválido igual
         * responde 204, así no se convierte en un oráculo para descubrir qué tokens
         * existen.
         */
        async revoke(refreshToken) {
            await this.refreshTokenRepository.revokeByTokenHash(this.hashToken(refreshToken));
        }
        /** Revoca todas las sesiones activas de un usuario. */
        async revokeAllForUser(userId) {
            await this.refreshTokenRepository.revokeAllForUser(userId);
        }
        hashToken(token) {
            return createHash('sha256').update(token).digest('hex');
        }
        /**
         * Deriva la vigencia del `exp` real del token ya firmado, en vez de reparsear
         * JWT_EXPIRES_IN ("15m", "1h", ...) a mano.
         */
        async getAccessTokenTtlSeconds(accessToken) {
            const decoded = await this.jwtService.verifyAsync(accessToken);
            return decoded.exp - decoded.iat;
        }
    };
    return TokenService = _classThis;
})();
export { TokenService };
