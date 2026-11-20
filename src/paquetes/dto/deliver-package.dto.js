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
import { Transform } from 'class-transformer';
import { Matches } from 'class-validator';
import { RequiredText } from '@Common/decorators';
let DeliverPackageDto = (() => {
    let _pickupCode_decorators;
    let _pickupCode_initializers = [];
    let _pickupCode_extraInitializers = [];
    let _deliveredTo_decorators;
    let _deliveredTo_initializers = [];
    let _deliveredTo_extraInitializers = [];
    return class DeliverPackageDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _pickupCode_decorators = [ApiProperty({
                    example: '482913',
                    description: 'Código de retiro de 6 dígitos.',
                }), Transform(({ value }) => typeof value === 'string' ? value.trim() : value), Matches(/^\d{6}$/, {
                    message: 'El código de retiro debe tener 6 dígitos.',
                })];
            _deliveredTo_decorators = [ApiProperty({ example: 'Ana Martínez', maxLength: 100 }), RequiredText('El nombre de quien recoge el paquete', 100)];
            __esDecorate(null, null, _pickupCode_decorators, { kind: "field", name: "pickupCode", static: false, private: false, access: { has: obj => "pickupCode" in obj, get: obj => obj.pickupCode, set: (obj, value) => { obj.pickupCode = value; } }, metadata: _metadata }, _pickupCode_initializers, _pickupCode_extraInitializers);
            __esDecorate(null, null, _deliveredTo_decorators, { kind: "field", name: "deliveredTo", static: false, private: false, access: { has: obj => "deliveredTo" in obj, get: obj => obj.deliveredTo, set: (obj, value) => { obj.deliveredTo = value; } }, metadata: _metadata }, _deliveredTo_initializers, _deliveredTo_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        pickupCode = __runInitializers(this, _pickupCode_initializers, void 0);
        deliveredTo = (__runInitializers(this, _pickupCode_extraInitializers), __runInitializers(this, _deliveredTo_initializers, void 0));
        constructor() {
            __runInitializers(this, _deliveredTo_extraInitializers);
        }
    };
})();
export { DeliverPackageDto };
