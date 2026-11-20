var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
import { Controller, Delete, Get, HttpCode, HttpStatus, ParseIntPipe, Post, UseFilters, } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiForbiddenResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse, ApiUnprocessableEntityResponse, } from '@nestjs/swagger';
import { Role } from '@PrismaClient';
import { Roles } from '@Auth/decorators';
import { ApiException } from '@Common/errors';
import { ApiExceptionFilter } from '@Common/filters';
import { BlockResponseDto } from '../dto/index.js';
const parseId = (label) => new ParseIntPipe({
    exceptionFactory: () => new ApiException(HttpStatus.BAD_REQUEST, 'SOLICITUD_INVALIDA', `El id ${label} debe ser un número entero.`),
});
let CommonAreaBlocksController = (() => {
    let _classDecorators = [ApiTags('areas'), ApiBearerAuth(), ApiUnauthorizedResponse({ description: 'NO_AUTENTICADO' }), ApiForbiddenResponse({ description: 'ROL_NO_PERMITIDO' }), ApiNotFoundResponse({ description: 'AREA_INEXISTENTE / BLOQUEO_INEXISTENTE' }), UseFilters(ApiExceptionFilter), Roles(Role.ADMINISTRADOR), Controller('areas/:areaId/bloqueos')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _findAll_decorators;
    let _create_decorators;
    let _remove_decorators;
    var CommonAreaBlocksController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _findAll_decorators = [Get(), ApiOperation({ summary: 'Lista los bloqueos de un área' }), ApiOkResponse({ type: [BlockResponseDto] })];
            _create_decorators = [Post(), ApiOperation({ summary: 'Bloquea un horario de uso permitido del área' }), ApiCreatedResponse({ type: BlockResponseDto }), ApiBadRequestResponse({ description: 'SOLICITUD_INVALIDA' }), ApiConflictResponse({ description: 'BLOQUEO_SUPERPUESTO / BLOQUEO_CON_RESERVAS' }), ApiUnprocessableEntityResponse({ description: 'DATOS_INVALIDOS / BLOQUEO_FUERA_DE_HORARIO' })];
            _remove_decorators = [Delete(':blockId'), HttpCode(HttpStatus.NO_CONTENT), ApiOperation({ summary: 'Elimina un bloqueo que aún no terminó' }), ApiNoContentResponse({ description: 'Bloqueo eliminado' }), ApiConflictResponse({ description: 'TRANSICION_INVALIDA: el bloqueo ya terminó' })];
            __esDecorate(this, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: obj => "findAll" in obj, get: obj => obj.findAll }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: obj => "create" in obj, get: obj => obj.create }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _remove_decorators, { kind: "method", name: "remove", static: false, private: false, access: { has: obj => "remove" in obj, get: obj => obj.remove }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CommonAreaBlocksController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        blocksService = __runInitializers(this, _instanceExtraInitializers);
        constructor(blocksService) {
            this.blocksService = blocksService;
        }
        async findAll(areaId) {
            const blocks = await this.blocksService.findAll(areaId);
            return blocks.map((block) => BlockResponseDto.fromEntity(block));
        }
        async create(areaId, dto, user) {
            const block = await this.blocksService.create(areaId, dto, user);
            return BlockResponseDto.fromEntity(block);
        }
        async remove(areaId, blockId) {
            await this.blocksService.remove(areaId, blockId);
        }
    };
    return CommonAreaBlocksController = _classThis;
})();
export { CommonAreaBlocksController };
