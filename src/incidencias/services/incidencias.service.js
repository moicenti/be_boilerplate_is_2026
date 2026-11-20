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
import { BadRequestException, ForbiddenException, Injectable, NotFoundException, } from '@nestjs/common';
import { Priority, Role } from '@PrismaClient';
const UNIT_REGEX = /^[A-Z]+-(?:[1-9]\d*)$/;
const ASSIGNABLE_STATUSES = ['Abierto', 'En atención', 'Rechazado'];
const RESOLVABLE_STATUSES = ['En atención'];
let IncidenciasService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var IncidenciasService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            IncidenciasService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        incidenciaRepository;
        constructor(incidenciaRepository) {
            this.incidenciaRepository = incidenciaRepository;
        }
        async create(user, data, photoUrls) {
            if (!user.unit) {
                throw new BadRequestException('Tu usuario no tiene una unidad asignada. Contacta a la administración.');
            }
            if (!UNIT_REGEX.test(user.unit.code)) {
                throw new BadRequestException(`La unidad "${user.unit.code}" no tiene un formato válido (esperado: A-12).`);
            }
            const year = new Date().getFullYear();
            const randomNum = Math.floor(1000 + Math.random() * 9000);
            const folio = `INC-${year}-${randomNum}`;
            return this.incidenciaRepository.create(user.id, user.unit.code, folio, data, photoUrls);
        }
        async findAll(userId) {
            return this.incidenciaRepository.findAllByUser(userId);
        }
        async findOne(id, userId) {
            const report = await this.incidenciaRepository.findOneByIdAndUser(id, userId);
            if (!report) {
                throw new NotFoundException('Reporte no encontrado o no tienes permiso para verlo');
            }
            return report;
        }
        async assignReport(reportId, dto, adminUser) {
            if (adminUser.role !== Role.ADMINISTRADOR) {
                throw new ForbiddenException('Solo un administrador puede asignar reportes');
            }
            const report = await this.incidenciaRepository.findById(reportId);
            if (!report) {
                throw new NotFoundException('Reporte no encontrado');
            }
            if (!ASSIGNABLE_STATUSES.includes(report.status)) {
                throw new BadRequestException(`No se puede asignar un reporte en estado "${report.status}".`);
            }
            if (dto.priority === Priority.CRITICA) {
                const justification = dto.priorityJustification?.trim() ?? '';
                if (justification.length < 10 || justification.length > 200) {
                    throw new BadRequestException('La justificación es obligatoria para prioridad Crítica (10-200 caracteres).');
                }
            }
            const assignee = await this.incidenciaRepository.findActiveMaintenanceById(dto.assigneeId);
            if (!assignee) {
                throw new BadRequestException('El responsable debe ser un usuario de mantenimiento activo.');
            }
            const newStatus = ['Abierto', 'Rechazado'].includes(report.status)
                ? 'En atención'
                : report.status;
            return this.incidenciaRepository.assign(reportId, {
                priority: dto.priority,
                assigneeId: dto.assigneeId,
                dueDate: new Date(dto.dueDate),
                priorityJustification: dto.priority === Priority.CRITICA
                    ? dto.priorityJustification.trim()
                    : null,
                updatedById: adminUser.id,
                newStatus,
            });
        }
        async resolveReport(reportId, dto, user) {
            if (user.role !== Role.ADMINISTRADOR && user.role !== Role.MANTENIMIENTO) {
                throw new ForbiddenException('Solo administración o mantenimiento pueden resolver reportes');
            }
            const report = await this.incidenciaRepository.findById(reportId);
            if (!report) {
                throw new NotFoundException('Reporte no encontrado');
            }
            if (!RESOLVABLE_STATUSES.includes(report.status)) {
                throw new BadRequestException(`Solo se pueden resolver reportes en estado "En atención". Estado actual: "${report.status}".`);
            }
            const comment = dto.resolutionComment?.trim() ?? '';
            if (comment.length < 10 || comment.length > 200) {
                throw new BadRequestException('El comentario de resolución es obligatorio (10-200 caracteres).');
            }
            return this.incidenciaRepository.resolve(reportId, {
                resolutionComment: comment,
                resolvedById: user.id,
            });
        }
        async findAllForAdmin(filters) {
            const [reports, counts] = await Promise.all([
                this.incidenciaRepository.findAllAdmin(filters),
                this.incidenciaRepository.countOpenByPriority(),
            ]);
            return { reports, counts };
        }
        async findMaintenanceUsers() {
            return this.incidenciaRepository.findMaintenanceUsers();
        }
        async confirmResolution(reportId, userId) {
            const report = await this.incidenciaRepository.findById(reportId);
            if (!report)
                throw new NotFoundException('Reporte no encontrado');
            // Solo el dueño puede confirmar
            if (report.userId !== userId) {
                throw new ForbiddenException('Solo el dueño del reporte puede confirmar la resolución');
            }
            // Solo se puede confirmar si está en estado "Resuelto"
            if (report.status !== 'Resuelto') {
                throw new BadRequestException(`Solo se pueden confirmar reportes en estado "Resuelto". Estado actual: "${report.status}".`);
            }
            return this.incidenciaRepository.confirmResolution(reportId, userId);
        }
        async rejectResolution(reportId, userId, comment) {
            const report = await this.incidenciaRepository.findById(reportId);
            if (!report)
                throw new NotFoundException('Reporte no encontrado');
            if (report.userId !== userId) {
                throw new ForbiddenException('Solo el dueño del reporte puede rechazar la resolución');
            }
            if (report.status !== 'Resuelto') {
                throw new BadRequestException(`Solo se pueden rechazar reportes en estado "Resuelto". Estado actual: "${report.status}".`);
            }
            const trimmed = comment?.trim() ?? '';
            if (trimmed.length < 10 || trimmed.length > 200) {
                throw new BadRequestException('El comentario de rechazo es obligatorio (10-200 caracteres)');
            }
            return this.incidenciaRepository.rejectResolution(reportId, userId, trimmed);
        }
    };
    return IncidenciasService = _classThis;
})();
export { IncidenciasService };
