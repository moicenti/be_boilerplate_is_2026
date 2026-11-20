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
import { Controller, Get, Patch, } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@Auth/decorators';
import { Role } from '@PrismaClient';
/**
 * H24. Centro de notificaciones del residente.
 * El residente sale siempre de la sesión: ningún endpoint recibe un ID de residente.
 * 401 y 403 (ROL_NO_PERMITIDO) los resuelven los guards globales.
 */
let NotificacionesController = (() => {
    let _classDecorators = [ApiTags('notificaciones'), ApiBearerAuth(), Roles(Role.RESIDENTE), Controller('notificaciones')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _listar_decorators;
    let _contarNoLeidas_decorators;
    let _marcarTodasLeidas_decorators;
    let _marcarLeida_decorators;
    var NotificacionesController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _listar_decorators = [Get(), ApiOperation({
                    summary: 'Listar mis notificaciones, de la más reciente a la más antigua',
                })];
            _contarNoLeidas_decorators = [Get('no-leidas/conteo'), ApiOperation({
                    summary: 'Número de notificaciones sin leer (indicador del encabezado)',
                })];
            _marcarTodasLeidas_decorators = [Patch('leidas/todas'), ApiOperation({ summary: 'Marcar todas mis notificaciones como leídas' })];
            _marcarLeida_decorators = [Patch(':id/leida'), ApiOperation({ summary: 'Marcar o desmarcar una notificación como leída' })];
            __esDecorate(this, null, _listar_decorators, { kind: "method", name: "listar", static: false, private: false, access: { has: obj => "listar" in obj, get: obj => obj.listar }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _contarNoLeidas_decorators, { kind: "method", name: "contarNoLeidas", static: false, private: false, access: { has: obj => "contarNoLeidas" in obj, get: obj => obj.contarNoLeidas }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _marcarTodasLeidas_decorators, { kind: "method", name: "marcarTodasLeidas", static: false, private: false, access: { has: obj => "marcarTodasLeidas" in obj, get: obj => obj.marcarTodasLeidas }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _marcarLeida_decorators, { kind: "method", name: "marcarLeida", static: false, private: false, access: { has: obj => "marcarLeida" in obj, get: obj => obj.marcarLeida }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            NotificacionesController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        centro = __runInitializers(this, _instanceExtraInitializers);
        constructor(centro) {
            this.centro = centro;
        }
        listar(sesion, query) {
            return this.centro.listar(sesion, query);
        }
        // Va antes de ':id/...' por claridad; no choca porque ese es PATCH.
        contarNoLeidas(sesion) {
            return this.centro.contarNoLeidas(sesion);
        }
        marcarTodasLeidas(sesion) {
            return this.centro.marcarTodasLeidas(sesion);
        }
        marcarLeida(sesion, id, dto) {
            return this.centro.cambiarLeida(sesion, id, dto.leida);
        }
    };
    return NotificacionesController = _classThis;
})();
export { NotificacionesController };
