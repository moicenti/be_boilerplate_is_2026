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
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Matches, Max, Min } from 'class-validator';
export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
let ScheduleDto = (() => {
    let _diaSemana_decorators;
    let _diaSemana_initializers = [];
    let _diaSemana_extraInitializers = [];
    let _horaApertura_decorators;
    let _horaApertura_initializers = [];
    let _horaApertura_extraInitializers = [];
    let _horaCierre_decorators;
    let _horaCierre_initializers = [];
    let _horaCierre_extraInitializers = [];
    return class ScheduleDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _diaSemana_decorators = [ApiProperty({ minimum: 0, maximum: 6, example: 6, description: '0 = domingo … 6 = sábado' }), IsInt({ message: 'diaSemana debe ser un número entero' }), Min(0, { message: 'diaSemana debe estar entre 0 y 6' }), Max(6, { message: 'diaSemana debe estar entre 0 y 6' })];
            _horaApertura_decorators = [ApiProperty({ example: '09:00' }), Matches(TIME_PATTERN, { message: 'horaApertura debe tener el formato HH:mm' })];
            _horaCierre_decorators = [ApiProperty({ example: '22:00' }), Matches(TIME_PATTERN, { message: 'horaCierre debe tener el formato HH:mm' })];
            __esDecorate(null, null, _diaSemana_decorators, { kind: "field", name: "diaSemana", static: false, private: false, access: { has: obj => "diaSemana" in obj, get: obj => obj.diaSemana, set: (obj, value) => { obj.diaSemana = value; } }, metadata: _metadata }, _diaSemana_initializers, _diaSemana_extraInitializers);
            __esDecorate(null, null, _horaApertura_decorators, { kind: "field", name: "horaApertura", static: false, private: false, access: { has: obj => "horaApertura" in obj, get: obj => obj.horaApertura, set: (obj, value) => { obj.horaApertura = value; } }, metadata: _metadata }, _horaApertura_initializers, _horaApertura_extraInitializers);
            __esDecorate(null, null, _horaCierre_decorators, { kind: "field", name: "horaCierre", static: false, private: false, access: { has: obj => "horaCierre" in obj, get: obj => obj.horaCierre, set: (obj, value) => { obj.horaCierre = value; } }, metadata: _metadata }, _horaCierre_initializers, _horaCierre_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        diaSemana = __runInitializers(this, _diaSemana_initializers, void 0);
        horaApertura = (__runInitializers(this, _diaSemana_extraInitializers), __runInitializers(this, _horaApertura_initializers, void 0));
        horaCierre = (__runInitializers(this, _horaApertura_extraInitializers), __runInitializers(this, _horaCierre_initializers, void 0));
        constructor() {
            __runInitializers(this, _horaCierre_extraInitializers);
        }
    };
})();
export { ScheduleDto };
