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
let DestinatariosRepository = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var DestinatariosRepository = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            DestinatariosRepository = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        constructor(prisma) {
            this.prisma = prisma;
        }
        async resolver(d) {
            switch (d.tipo) {
                case 'RESIDENTE': {
                    const u = await this.prisma.user.findUnique({
                        where: { id: d.id },
                        select: { id: true, unitId: true },
                    });
                    if (!u)
                        return null;
                    return [{ id: u.id, unidadId: u.unitId }];
                }
                case 'UNIDAD': {
                    const unidad = await this.prisma.unit.findUnique({
                        where: { id: d.id },
                        select: { id: true },
                    });
                    if (!unidad)
                        return null;
                    const us = await this.prisma.user.findMany({
                        where: { unitId: unidad.id, isActive: true, role: 'RESIDENTE' },
                        select: { id: true },
                    });
                    return us.map((u) => ({ id: u.id, unidadId: unidad.id }));
                }
                case 'GRUPO': {
                    const unidades = await this.prisma.unit.findMany({
                        where: { tower: d.id },
                        select: { id: true },
                    });
                    if (unidades.length === 0)
                        return null;
                    const ids = unidades.map((x) => x.id);
                    const porId = new Map(unidades.map((x) => [x.id, x.id]));
                    const us = await this.prisma.user.findMany({
                        where: {
                            unitId: { in: ids },
                            isActive: true,
                            role: 'RESIDENTE',
                        },
                        select: { id: true, unitId: true },
                    });
                    return us.map((u) => ({
                        id: u.id,
                        unidadId: u.unitId ? porId.get(u.unitId) ?? null : null,
                    }));
                }
                default:
                    return null;
            }
        }
        async desactivados(residenteIds, modulo) {
            if (residenteIds.length === 0)
                return new Set();
            const filas = await this.prisma.preferenciaNotificacion.findMany({
                where: {
                    residenteId: { in: residenteIds },
                    moduloOrigen: modulo,
                    activo: false,
                },
                select: { residenteId: true },
            });
            return new Set(filas.map((f) => f.residenteId));
        }
    };
    return DestinatariosRepository = _classThis;
})();
export { DestinatariosRepository };
