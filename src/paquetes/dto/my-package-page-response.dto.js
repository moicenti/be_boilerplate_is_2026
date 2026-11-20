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
import { PackageResponseDto } from './package-response.dto.js';
let MyPackagePageResponseDto = (() => {
    let _items_decorators;
    let _items_initializers = [];
    let _items_extraInitializers = [];
    let _page_decorators;
    let _page_initializers = [];
    let _page_extraInitializers = [];
    let _pageSize_decorators;
    let _pageSize_initializers = [];
    let _pageSize_extraInitializers = [];
    let _total_decorators;
    let _total_initializers = [];
    let _total_extraInitializers = [];
    let _totalPages_decorators;
    let _totalPages_initializers = [];
    let _totalPages_extraInitializers = [];
    let _pendingCount_decorators;
    let _pendingCount_initializers = [];
    let _pendingCount_extraInitializers = [];
    return class MyPackagePageResponseDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _items_decorators = [ApiProperty({ type: PackageResponseDto, isArray: true })];
            _page_decorators = [ApiProperty({ example: 1 })];
            _pageSize_decorators = [ApiProperty({ example: 20 })];
            _total_decorators = [ApiProperty({ example: 6, description: 'Total con el filtro aplicado.' })];
            _totalPages_decorators = [ApiProperty({ example: 1 })];
            _pendingCount_decorators = [ApiProperty({
                    example: 2,
                    description: 'Paquetes pendientes de retiro de la unidad.',
                })];
            __esDecorate(null, null, _items_decorators, { kind: "field", name: "items", static: false, private: false, access: { has: obj => "items" in obj, get: obj => obj.items, set: (obj, value) => { obj.items = value; } }, metadata: _metadata }, _items_initializers, _items_extraInitializers);
            __esDecorate(null, null, _page_decorators, { kind: "field", name: "page", static: false, private: false, access: { has: obj => "page" in obj, get: obj => obj.page, set: (obj, value) => { obj.page = value; } }, metadata: _metadata }, _page_initializers, _page_extraInitializers);
            __esDecorate(null, null, _pageSize_decorators, { kind: "field", name: "pageSize", static: false, private: false, access: { has: obj => "pageSize" in obj, get: obj => obj.pageSize, set: (obj, value) => { obj.pageSize = value; } }, metadata: _metadata }, _pageSize_initializers, _pageSize_extraInitializers);
            __esDecorate(null, null, _total_decorators, { kind: "field", name: "total", static: false, private: false, access: { has: obj => "total" in obj, get: obj => obj.total, set: (obj, value) => { obj.total = value; } }, metadata: _metadata }, _total_initializers, _total_extraInitializers);
            __esDecorate(null, null, _totalPages_decorators, { kind: "field", name: "totalPages", static: false, private: false, access: { has: obj => "totalPages" in obj, get: obj => obj.totalPages, set: (obj, value) => { obj.totalPages = value; } }, metadata: _metadata }, _totalPages_initializers, _totalPages_extraInitializers);
            __esDecorate(null, null, _pendingCount_decorators, { kind: "field", name: "pendingCount", static: false, private: false, access: { has: obj => "pendingCount" in obj, get: obj => obj.pendingCount, set: (obj, value) => { obj.pendingCount = value; } }, metadata: _metadata }, _pendingCount_initializers, _pendingCount_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        items = __runInitializers(this, _items_initializers, void 0);
        page = (__runInitializers(this, _items_extraInitializers), __runInitializers(this, _page_initializers, void 0));
        pageSize = (__runInitializers(this, _page_extraInitializers), __runInitializers(this, _pageSize_initializers, void 0));
        total = (__runInitializers(this, _pageSize_extraInitializers), __runInitializers(this, _total_initializers, void 0));
        totalPages = (__runInitializers(this, _total_extraInitializers), __runInitializers(this, _totalPages_initializers, void 0));
        pendingCount = (__runInitializers(this, _totalPages_extraInitializers), __runInitializers(this, _pendingCount_initializers, void 0));
        constructor() {
            __runInitializers(this, _pendingCount_extraInitializers);
        }
    };
})();
export { MyPackagePageResponseDto };
