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
import { BadRequestException, Injectable, NotFoundException, } from '@nestjs/common';
const MAX_VIGENCIA_HORAS = 24;
const MAX_ACOMPANANTES = 5;
function generarCodigo() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
let PreautorizacionService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var PreautorizacionService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            PreautorizacionService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        repo;
        constructor(repo) {
            this.repo = repo;
        }
        async create(user, data) {
            if (!user.unitId) {
                throw new BadRequestException('Tu usuario no tiene una unidad asignada. Contacta a la administración.');
            }
            const inicio = new Date(data.inicio);
            const fin = new Date(data.fin);
            const ahora = new Date();
            if (inicio < ahora) {
                throw new BadRequestException('La fecha de inicio no puede ser anterior a la actual.');
            }
            if (fin <= inicio) {
                throw new BadRequestException('La fecha de fin debe ser posterior al inicio.');
            }
            const diffHoras = (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60);
            if (diffHoras > MAX_VIGENCIA_HORAS) {
                throw new BadRequestException(`La vigencia no puede superar las ${MAX_VIGENCIA_HORAS} horas.`);
            }
            if (data.acompanantes < 0 || data.acompanantes > MAX_ACOMPANANTES) {
                throw new BadRequestException(`Los acompañantes deben estar entre 0 y ${MAX_ACOMPANANTES}.`);
            }
            let codigo = generarCodigo();
            for (let i = 0; i < 5; i++) {
                const existente = await this.repo.findByCodigo(codigo);
                if (!existente)
                    break;
                codigo = generarCodigo();
            }
            return this.repo.create(user.id, user.unitId, codigo, data);
        }
        async findAll(userId) {
            return this.repo.findAllByResidente(userId);
        }
        async findOne(id, userId) {
            const pre = await this.repo.findByIdAndResidente(id, userId);
            if (!pre) {
                throw new NotFoundException('Pre-autorización no encontrada');
            }
            return pre;
        }
    };
    return PreautorizacionService = _classThis;
})();
export { PreautorizacionService };
