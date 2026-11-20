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
import { Role } from '@PrismaClient';
let UnitResponseDto = (() => {
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _code_decorators;
    let _code_initializers = [];
    let _code_extraInitializers = [];
    let _tower_decorators;
    let _tower_initializers = [];
    let _tower_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    return class UnitResponseDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _id_decorators = [ApiProperty({ format: 'uuid' })];
            _code_decorators = [ApiProperty({ example: 'A-19' })];
            _tower_decorators = [ApiProperty({ example: 'Torre A' })];
            _description_decorators = [ApiProperty({ example: 'Torre A, departamento 19' })];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
            __esDecorate(null, null, _code_decorators, { kind: "field", name: "code", static: false, private: false, access: { has: obj => "code" in obj, get: obj => obj.code, set: (obj, value) => { obj.code = value; } }, metadata: _metadata }, _code_initializers, _code_extraInitializers);
            __esDecorate(null, null, _tower_decorators, { kind: "field", name: "tower", static: false, private: false, access: { has: obj => "tower" in obj, get: obj => obj.tower, set: (obj, value) => { obj.tower = value; } }, metadata: _metadata }, _tower_initializers, _tower_extraInitializers);
            __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        id = __runInitializers(this, _id_initializers, void 0);
        code = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _code_initializers, void 0));
        tower = (__runInitializers(this, _code_extraInitializers), __runInitializers(this, _tower_initializers, void 0));
        description = (__runInitializers(this, _tower_extraInitializers), __runInitializers(this, _description_initializers, void 0));
        static from(unit) {
            return {
                id: unit.id,
                code: unit.code,
                tower: unit.tower,
                description: unit.description,
            };
        }
        constructor() {
            __runInitializers(this, _description_extraInitializers);
        }
    };
})();
let UserResponseDto = (() => {
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _email_decorators;
    let _email_initializers = [];
    let _email_extraInitializers = [];
    let _isActive_decorators;
    let _isActive_initializers = [];
    let _isActive_extraInitializers = [];
    let _unit_decorators;
    let _unit_initializers = [];
    let _unit_extraInitializers = [];
    let _role_decorators;
    let _role_initializers = [];
    let _role_extraInitializers = [];
    let _createdAt_decorators;
    let _createdAt_initializers = [];
    let _createdAt_extraInitializers = [];
    return class UserResponseDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _id_decorators = [ApiProperty({ format: 'uuid' })];
            _email_decorators = [ApiProperty({ example: 'nestor@example.com', format: 'email' })];
            _isActive_decorators = [ApiProperty()];
            _unit_decorators = [ApiProperty({ type: UnitResponseDto, nullable: true })];
            _role_decorators = [ApiProperty({ enum: Role, example: Role.RESIDENTE })];
            _createdAt_decorators = [ApiProperty({ type: String, format: 'date-time' })];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
            __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: obj => "email" in obj, get: obj => obj.email, set: (obj, value) => { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
            __esDecorate(null, null, _isActive_decorators, { kind: "field", name: "isActive", static: false, private: false, access: { has: obj => "isActive" in obj, get: obj => obj.isActive, set: (obj, value) => { obj.isActive = value; } }, metadata: _metadata }, _isActive_initializers, _isActive_extraInitializers);
            __esDecorate(null, null, _unit_decorators, { kind: "field", name: "unit", static: false, private: false, access: { has: obj => "unit" in obj, get: obj => obj.unit, set: (obj, value) => { obj.unit = value; } }, metadata: _metadata }, _unit_initializers, _unit_extraInitializers);
            __esDecorate(null, null, _role_decorators, { kind: "field", name: "role", static: false, private: false, access: { has: obj => "role" in obj, get: obj => obj.role, set: (obj, value) => { obj.role = value; } }, metadata: _metadata }, _role_initializers, _role_extraInitializers);
            __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: obj => "createdAt" in obj, get: obj => obj.createdAt, set: (obj, value) => { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        id = __runInitializers(this, _id_initializers, void 0);
        email = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _email_initializers, void 0));
        isActive = (__runInitializers(this, _email_extraInitializers), __runInitializers(this, _isActive_initializers, void 0));
        unit = (__runInitializers(this, _isActive_extraInitializers), __runInitializers(this, _unit_initializers, void 0));
        role = (__runInitializers(this, _unit_extraInitializers), __runInitializers(this, _role_initializers, void 0));
        createdAt = (__runInitializers(this, _role_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
        static fromEntity(user) {
            return {
                id: user.id,
                email: user.email,
                isActive: user.isActive,
                createdAt: user.createdAt,
                unit: user.unit ? UnitResponseDto.from(user.unit) : null,
                role: user.role,
            };
        }
        constructor() {
            __runInitializers(this, _createdAt_extraInitializers);
        }
    };
})();
export { UserResponseDto };
