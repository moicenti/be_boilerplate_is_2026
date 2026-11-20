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
import { Injectable } from '@nestjs/common';
/**
 * Único punto del módulo que habla con la tabla `refresh_tokens`.
 *
 * Nota: acá siempre se maneja el *hash* del token, nunca el valor en claro.
 * El hasheo vive en TokenService, que es quien conoce el secreto del esquema.
 */
let RefreshTokenRepository = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RefreshTokenRepository = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RefreshTokenRepository = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        constructor(prisma) {
            this.prisma = prisma;
        }
        create(data) {
            return this.prisma.refreshToken.create({ data });
        }
        /** Busca por hash trayendo el usuario, para validar la sesión en una sola query. */
        findByTokenHashWithUser(tokenHash) {
            return this.prisma.refreshToken.findUnique({
                where: { tokenHash },
                include: { user: true },
            });
        }
        revokeById(id) {
            return this.prisma.refreshToken.update({
                where: { id },
                data: { revokedAt: new Date() },
            });
        }
        /**
         * Revoca por hash. Devuelve cuántas filas cambiaron.
         *
         * Usa `updateMany` con `revokedAt: null` en el filtro para que sea
         * idempotente: si el token no existe o ya estaba revocado, no lanza, solo
         * devuelve 0.
         */
        revokeByTokenHash(tokenHash) {
            return this.prisma.refreshToken
                .updateMany({
                where: { tokenHash, revokedAt: null },
                data: { revokedAt: new Date() },
            })
                .then((result) => result.count);
        }
        /** Revoca todas las sesiones activas de un usuario. Devuelve cuántas cerró. */
        revokeAllForUser(userId) {
            return this.prisma.refreshToken
                .updateMany({
                where: { userId, revokedAt: null },
                data: { revokedAt: new Date() },
            })
                .then((result) => result.count);
        }
        /** Utilidad de mantenimiento: limpia tokens vencidos. */
        deleteExpired(now = new Date()) {
            return this.prisma.refreshToken
                .deleteMany({ where: { expiresAt: { lt: now } } })
                .then((result) => result.count);
        }
    };
    return RefreshTokenRepository = _classThis;
})();
export { RefreshTokenRepository };
