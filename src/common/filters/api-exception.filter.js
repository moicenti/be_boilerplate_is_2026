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
import { Catch, HttpException, HttpStatus, } from '@nestjs/common';
/** Código por defecto para excepciones de Nest que no traen uno propio. */
const DEFAULT_CODES = {
    [HttpStatus.BAD_REQUEST]: 'SOLICITUD_INVALIDA',
    [HttpStatus.UNAUTHORIZED]: 'NO_AUTENTICADO',
    [HttpStatus.FORBIDDEN]: 'ROL_NO_PERMITIDO',
    [HttpStatus.NOT_FOUND]: 'RECURSO_INEXISTENTE',
    [HttpStatus.CONFLICT]: 'CONFLICTO',
    [HttpStatus.UNPROCESSABLE_ENTITY]: 'DATOS_INVALIDOS',
};
/**
 * Normaliza cualquier HttpException al formato `{codigo, mensaje}`.
 *
 * - Si la excepción ya es una ApiException, su cuerpo se respeta tal cual.
 * - Si no (ValidationPipe, ParseIntPipe, el guard JWT...), se deriva el código
 *   del status y el mensaje del cuerpo original. Los errores de validación
 *   llegan como arreglo de mensajes y se unen en uno solo.
 *
 * Se aplica por controlador con `@UseFilters` para no cambiar el formato de
 * los endpoints que ya existen (auth, users, incidencias).
 */
let ApiExceptionFilter = (() => {
    let _classDecorators = [Catch(HttpException)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ApiExceptionFilter = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ApiExceptionFilter = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        catch(exception, host) {
            const response = host.switchToHttp().getResponse();
            const status = exception.getStatus();
            response.status(status).json(this.toBody(exception, status));
        }
        toBody(exception, status) {
            const original = exception.getResponse();
            if (typeof original === 'object' && original !== null && 'codigo' in original) {
                return original;
            }
            const rawMessage = typeof original === 'string'
                ? original
                : original.message;
            return {
                codigo: DEFAULT_CODES[status] ?? 'ERROR',
                mensaje: Array.isArray(rawMessage)
                    ? rawMessage.join('. ')
                    : (rawMessage ?? exception.message),
            };
        }
    };
    return ApiExceptionFilter = _classThis;
})();
export { ApiExceptionFilter };
