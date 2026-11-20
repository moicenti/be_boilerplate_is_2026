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
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength, ValidateIf, } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Priority } from '@PrismaClient';
let AsignarIncidenciaDto = (() => {
    let _priority_decorators;
    let _priority_initializers = [];
    let _priority_extraInitializers = [];
    let _assigneeId_decorators;
    let _assigneeId_initializers = [];
    let _assigneeId_extraInitializers = [];
    let _dueDate_decorators;
    let _dueDate_initializers = [];
    let _dueDate_extraInitializers = [];
    let _priorityJustification_decorators;
    let _priorityJustification_initializers = [];
    let _priorityJustification_extraInitializers = [];
    return class AsignarIncidenciaDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _priority_decorators = [ApiProperty({ enum: Priority, example: Priority.ALTA }), IsEnum(Priority, { message: 'Prioridad inválida' })];
            _assigneeId_decorators = [ApiProperty({ format: 'uuid' }), IsUUID('4', { message: 'assigneeId debe ser un UUID válido' })];
            _dueDate_decorators = [ApiProperty({ format: 'date-time', example: '2026-11-20T18:00:00.000Z' }), IsDateString({}, { message: 'dueDate debe ser una fecha válida (ISO 8601)' })];
            _priorityJustification_decorators = [ApiProperty({
                    required: false,
                    description: 'Obligatoria si priority = CRITICA (10-200 caracteres)',
                }), ValidateIf((o) => o.priority === Priority.CRITICA), IsString(), IsNotEmpty({ message: 'La justificación es obligatoria para prioridad Crítica' }), MinLength(10, { message: 'La justificación debe tener al menos 10 caracteres' }), MaxLength(200, { message: 'La justificación no puede exceder 200 caracteres' }), IsOptional()];
            __esDecorate(null, null, _priority_decorators, { kind: "field", name: "priority", static: false, private: false, access: { has: obj => "priority" in obj, get: obj => obj.priority, set: (obj, value) => { obj.priority = value; } }, metadata: _metadata }, _priority_initializers, _priority_extraInitializers);
            __esDecorate(null, null, _assigneeId_decorators, { kind: "field", name: "assigneeId", static: false, private: false, access: { has: obj => "assigneeId" in obj, get: obj => obj.assigneeId, set: (obj, value) => { obj.assigneeId = value; } }, metadata: _metadata }, _assigneeId_initializers, _assigneeId_extraInitializers);
            __esDecorate(null, null, _dueDate_decorators, { kind: "field", name: "dueDate", static: false, private: false, access: { has: obj => "dueDate" in obj, get: obj => obj.dueDate, set: (obj, value) => { obj.dueDate = value; } }, metadata: _metadata }, _dueDate_initializers, _dueDate_extraInitializers);
            __esDecorate(null, null, _priorityJustification_decorators, { kind: "field", name: "priorityJustification", static: false, private: false, access: { has: obj => "priorityJustification" in obj, get: obj => obj.priorityJustification, set: (obj, value) => { obj.priorityJustification = value; } }, metadata: _metadata }, _priorityJustification_initializers, _priorityJustification_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        priority = __runInitializers(this, _priority_initializers, void 0);
        assigneeId = (__runInitializers(this, _priority_extraInitializers), __runInitializers(this, _assigneeId_initializers, void 0));
        dueDate = (__runInitializers(this, _assigneeId_extraInitializers), __runInitializers(this, _dueDate_initializers, void 0));
        priorityJustification = (__runInitializers(this, _dueDate_extraInitializers), __runInitializers(this, _priorityJustification_initializers, void 0));
        constructor() {
            __runInitializers(this, _priorityJustification_extraInitializers);
        }
    };
})();
export { AsignarIncidenciaDto };
