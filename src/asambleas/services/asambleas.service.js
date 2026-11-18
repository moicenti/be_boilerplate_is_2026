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
import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, } from '@nestjs/common';
import { AssemblyType, Role } from '@PrismaClient';
import { assemblyStatus } from '../domain/assembly-status.js';
const PAGE_SIZE = 20;
const TIME_ZONE = 'America/El_Salvador';
const UTC_OFFSET = '-06:00';
const MODULO_ORIGEN = 'votaciones';
let AsambleasService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AsambleasService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AsambleasService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        assemblyRepository;
        notificacionesService;
        logger = new Logger(AsambleasService.name);
        constructor(assemblyRepository, notificacionesService) {
            this.assemblyRepository = assemblyRepository;
            this.notificacionesService = notificacionesService;
        }
        now() {
            return new Date();
        }
        async create(dto, admin) {
            const data = this.toData(dto);
            this.assertValid(this.assemblyErrors(data, this.now()));
            const number = await this.assemblyRepository.nextNumber();
            return this.assemblyRepository.create(data, {
                number,
                folio: this.buildFolio(number, this.now()),
                createdById: admin.id,
            });
        }
        async updateDraft(id, dto) {
            const assembly = await this.findOrFail(id);
            if (assembly.publishedAt)
                throw this.alreadyPublished();
            const data = this.toData(dto);
            this.assertValid(this.assemblyErrors(data, this.now()));
            const updated = await this.assemblyRepository.replaceDraft(id, data);
            if (!updated)
                throw this.alreadyPublished();
            return updated;
        }
        async publish(id, admin) {
            const assembly = await this.findOrFail(id);
            if (assembly.publishedAt)
                throw this.alreadyPublished();
            const now = this.now();
            this.assertValid(this.assemblyErrors(this.fromEntity(assembly), now));
            const published = await this.assemblyRepository.publishIfDraft(id, now);
            if (!published)
                throw this.alreadyPublished();
            const result = await this.findOrFail(id);
            await this.notifyCommunity(result, admin);
            return result;
        }
        async findOne(id, user) {
            const assembly = await this.assemblyRepository.findById(id);
            if (!assembly ||
                (!assembly.publishedAt && user.role !== Role.ADMINISTRADOR)) {
                throw new NotFoundException('La asamblea no existe.');
            }
            return assembly;
        }
        async list(query, user) {
            const now = this.now();
            const all = await this.assemblyRepository.findAll({
                search: query.q,
                from: query.desde
                    ? new Date(`${query.desde}T00:00:00${UTC_OFFSET}`)
                    : undefined,
                to: query.hasta
                    ? new Date(`${query.hasta}T23:59:59.999${UTC_OFFSET}`)
                    : undefined,
                onlyPublished: user.role !== Role.ADMINISTRADOR,
            });
            const withStatus = all.map((assembly) => ({
                assembly,
                status: assemblyStatus(assembly.topics, assembly.publishedAt !== null, now),
            }));
            const counts = {
                TODAS: withStatus.length,
                BORRADOR: 0,
                PROGRAMADA: 0,
                ABIERTA: 0,
                CERRADA: 0,
            };
            for (const { status } of withStatus)
                counts[status] += 1;
            const filtered = query.estado
                ? withStatus.filter(({ status }) => status === query.estado)
                : withStatus;
            const start = (query.page - 1) * PAGE_SIZE;
            return {
                items: filtered
                    .slice(start, start + PAGE_SIZE)
                    .map(({ assembly }) => assembly),
                page: query.page,
                pageSize: PAGE_SIZE,
                total: filtered.length,
                totalPages: Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
                counts,
            };
        }
        async updateTopic(topicId, dto) {
            const topic = await this.assemblyRepository.findTopicById(topicId);
            if (!topic)
                throw new NotFoundException('La propuesta no existe.');
            const now = this.now();
            if (now >= topic.opensAt)
                throw this.votingAlreadyOpened();
            const data = this.toTopicData(dto);
            this.assertValid(this.topicErrors(data, now, ''));
            const updated = await this.assemblyRepository.updateTopicIfNotOpened(topicId, data, now);
            if (!updated)
                throw this.votingAlreadyOpened();
            return this.findOrFail(topic.assemblyId);
        }
        async audience() {
            return this.assemblyRepository.countActiveResidents();
        }
        buildFolio(number, date) {
            return `ASM-${date.getFullYear()}-${String(number).padStart(3, '0')}`;
        }
        assemblyErrors(data, now) {
            const errors = [];
            const minute = this.startOfMinute(now);
            if (data.startsAt < minute) {
                errors.push('La fecha y hora de la reunión deben ser posteriores a la actual.');
            }
            if (data.endsAt <= data.startsAt) {
                errors.push('La hora de fin debe ser posterior a la hora de inicio.');
            }
            data.topics.forEach((topic, index) => {
                const prefix = data.topics.length > 1 ? `Propuesta ${index + 1}: ` : '';
                errors.push(...this.topicErrors(topic, now, prefix));
            });
            return errors;
        }
        topicErrors(topic, now, prefix) {
            const errors = [];
            if (topic.opensAt < this.startOfMinute(now)) {
                errors.push(`${prefix}La apertura de la votación no puede ser anterior a la fecha y hora actuales.`);
            }
            if (topic.closesAt <= topic.opensAt) {
                errors.push(`${prefix}El cierre de la votación debe ser posterior a la apertura.`);
            }
            const normalized = topic.options.map((option) => option.toLocaleLowerCase('es'));
            if (new Set(normalized).size !== normalized.length) {
                errors.push(`${prefix}Las opciones no pueden repetirse.`);
            }
            return errors;
        }
        async notifyCommunity(assembly, admin) {
            const towers = await this.assemblyRepository.towers();
            const opensAt = Math.min(...assembly.topics.map((t) => t.opensAt.getTime()));
            const kind = assembly.type === AssemblyType.EXTRAORDINARIA
                ? 'extraordinaria'
                : 'ordinaria';
            const proposals = assembly.topics.length === 1
                ? '1 propuesta a votar'
                : `${assembly.topics.length} propuestas a votar`;
            const mensaje = `Asamblea ${kind} el ${this.format(assembly.startsAt)} en ${assembly.location}. ` +
                `${proposals}; la votación abre el ${this.format(new Date(opensAt))}.`;
            for (const tower of towers) {
                try {
                    await this.notificacionesService.emitir({
                        destinatario: { tipo: 'GRUPO', id: tower },
                        tipo: 'CONVOCATORIA_ASAMBLEA',
                        titulo: `Convocatoria: ${assembly.title}`,
                        mensaje,
                        moduloOrigen: MODULO_ORIGEN,
                        enlaceAccion: `/asambleas/${assembly.id}`,
                    }, { id: admin.id, rol: admin.role });
                }
                catch (error) {
                    this.logger.warn(`No se pudo avisar a ${tower} de la asamblea ${assembly.folio}: ${String(error)}`);
                }
            }
        }
        toData(dto) {
            return {
                title: dto.title,
                type: dto.type,
                modality: dto.modality,
                startsAt: dto.startsAt,
                endsAt: dto.endsAt,
                location: dto.location,
                description: dto.description,
                agenda: dto.agenda.map((item) => ({
                    title: item.title,
                    description: item.description,
                })),
                topics: dto.topics.map((topic) => this.toTopicData(topic)),
            };
        }
        toTopicData(dto) {
            return {
                title: dto.title,
                description: dto.description,
                opensAt: dto.opensAt,
                closesAt: dto.closesAt,
                options: dto.options,
            };
        }
        fromEntity(assembly) {
            return {
                ...assembly,
                agenda: assembly.agendaItems,
                topics: assembly.topics.map((topic) => ({
                    ...topic,
                    options: topic.options.map((option) => option.text),
                })),
            };
        }
        assertValid(errors) {
            if (errors.length > 0) {
                throw new BadRequestException({
                    message: errors,
                    error: 'Bad Request',
                    statusCode: 400,
                });
            }
        }
        async findOrFail(id) {
            const assembly = await this.assemblyRepository.findById(id);
            if (!assembly)
                throw new NotFoundException('La asamblea no existe.');
            return assembly;
        }
        alreadyPublished() {
            return new ConflictException('La convocatoria ya fue publicada. Solo se pueden editar las propuestas cuya votación no ha abierto.');
        }
        votingAlreadyOpened() {
            return new ConflictException('La votación de esta propuesta ya abrió; no se puede modificar su texto ni sus opciones.');
        }
        startOfMinute(date) {
            return new Date(Math.floor(date.getTime() / 60_000) * 60_000);
        }
        format(date) {
            return new Intl.DateTimeFormat('es-SV', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone: TIME_ZONE,
            }).format(date);
        }
    };
    return AsambleasService = _classThis;
})();
export { AsambleasService };
