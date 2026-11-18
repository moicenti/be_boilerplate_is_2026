import { HttpStatus, Injectable } from '@nestjs/common';
import {
  FeeAmountType,
  FeeRuleScope,
  FeeRuleStatus,
  InactiveUnitPolicy,
  Prisma,
  UnitType,
  type User,
} from '@PrismaClient';
import { ApiException } from '@Common/errors';
import {
  FeeRuleRepository,
  toRuleData,
  type FeeRuleChangeWithUser,
  type FeeRuleData,
  type FeeRuleWithConfig,
} from '../repositories/index.js';
import { FeeRuleDuplicateError } from '../errors/index.js';
import type { CreateFeeRuleDto, SaveFeeRuleDto } from '../dto/index.js';

export interface FeeRuleView {
  rule: FeeRuleWithConfig;
  applicableUnits: number;
}

const SCOPES_WITH_VALUE: FeeRuleScope[] = [
  FeeRuleScope.TORRE,
  FeeRuleScope.TIPO,
];

@Injectable()
export class FeeRulesService {
  constructor(private readonly repository: FeeRuleRepository) {}

  async findAll(status?: FeeRuleStatus): Promise<FeeRuleView[]> {
    const rules = await this.repository.findAll(status);
    return Promise.all(rules.map((rule) => this.view(rule)));
  }

  async findOne(id: number): Promise<FeeRuleView> {
    return this.view(await this.getRule(id));
  }

  async create(dto: CreateFeeRuleDto, user: User): Promise<FeeRuleView> {
    const data = await this.toData(dto);
    const status = dto.estado ?? FeeRuleStatus.ACTIVA;
    if (status === FeeRuleStatus.ACTIVA) await this.assertComplete(data);
    if (status !== FeeRuleStatus.INACTIVA) await this.assertNotDuplicate(data);

    const rule = await this.guardDuplicate(() =>
      this.repository.create(data, status, user.id),
    );
    return this.view(rule);
  }

  async update(
    id: number,
    dto: SaveFeeRuleDto,
    user: User,
  ): Promise<FeeRuleView> {
    const previous = await this.getRule(id);
    const data = await this.toData(dto);
    if (previous.status === FeeRuleStatus.ACTIVA)
      await this.assertComplete(data);
    if (previous.status !== FeeRuleStatus.INACTIVA)
      await this.assertNotDuplicate(data, id);

    const rule = await this.guardDuplicate(() =>
      this.repository.update(previous, data, user.id),
    );
    return this.view(rule);
  }

  async changeStatus(
    id: number,
    status: FeeRuleStatus,
    user: User,
  ): Promise<FeeRuleWithConfig> {
    const previous = await this.getRule(id);
    if (previous.status === status) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        'TRANSICION_INVALIDA',
        `La regla ya está ${status}.`,
      );
    }

    const data = toRuleData(previous);
    if (status === FeeRuleStatus.ACTIVA) await this.assertComplete(data);
    // Al salir de INACTIVA vuelve a contar para la unicidad de concepto y alcance.
    if (previous.status === FeeRuleStatus.INACTIVA)
      await this.assertNotDuplicate(data, id);

    return this.guardDuplicate(() =>
      this.repository.changeStatus(previous, status, user.id),
    );
  }

  async findChanges(id: number): Promise<FeeRuleChangeWithUser[]> {
    await this.getRule(id);
    return this.repository.findChanges(id);
  }

  private async getRule(id: number): Promise<FeeRuleWithConfig> {
    const rule = await this.repository.findById(id);
    if (!rule) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'REGLA_INEXISTENTE',
        'La regla de cuota no existe.',
      );
    }
    return rule;
  }

  private async view(rule: FeeRuleWithConfig): Promise<FeeRuleView> {
    return {
      rule,
      applicableUnits: await this.repository.countScopeUnits({
        scope: rule.scope,
        scopeValue: rule.scopeValue,
        unitIds: rule.units.map((u) => u.unitId),
      }),
    };
  }

  /** Coherencia del request (400). Que la regla esté completa se valida al activarla (422). */
  private async toData(dto: SaveFeeRuleDto): Promise<FeeRuleData> {
    if (dto.diaVencimiento < dto.diaGeneracion) {
      throw this.invalid(
        'diaVencimiento debe ser mayor o igual a diaGeneracion.',
      );
    }

    const typeAmounts = dto.montosPorTipo ?? [];
    if (dto.tipoMonto === FeeAmountType.FIJO && typeAmounts.length > 0) {
      throw this.invalid(
        'montosPorTipo solo aplica con tipoMonto POR_TIPO_UNIDAD.',
      );
    }
    if (dto.tipoMonto === FeeAmountType.POR_TIPO_UNIDAD && dto.monto != null) {
      throw this.invalid(
        'Con tipoMonto POR_TIPO_UNIDAD el monto se indica en montosPorTipo.',
      );
    }
    if (new Set(typeAmounts.map((t) => t.tipo)).size !== typeAmounts.length) {
      throw this.invalid('montosPorTipo no puede repetir un tipo de unidad.');
    }

    const scopeValue = dto.alcanceValor ?? null;
    if (SCOPES_WITH_VALUE.includes(dto.alcance) && scopeValue === null) {
      throw this.invalid(
        `alcanceValor es obligatorio con alcance ${dto.alcance}.`,
      );
    }
    if (!SCOPES_WITH_VALUE.includes(dto.alcance) && scopeValue !== null) {
      throw this.invalid('alcanceValor solo aplica con alcance TORRE o TIPO.');
    }
    if (
      dto.alcance === FeeRuleScope.TIPO &&
      !Object.values(UnitType).includes(scopeValue as UnitType)
    ) {
      throw this.invalid(
        'Con alcance TIPO, alcanceValor debe ser DEPARTAMENTO, CASA o LOCAL.',
      );
    }

    const unitIds = [...new Set(dto.unidadIds ?? [])];
    if (dto.alcance !== FeeRuleScope.SELECCION && unitIds.length > 0) {
      throw this.invalid('unidadIds solo aplica con alcance SELECCION.');
    }
    if (unitIds.length > 0) {
      const existing = new Set(
        await this.repository.findExistingUnitIds(unitIds),
      );
      const missing = unitIds.filter((unitId) => !existing.has(unitId));
      if (missing.length > 0)
        throw this.invalid(`Unidades inexistentes: ${missing.join(', ')}.`);
    }

    return {
      concept: dto.concepto,
      amountType: dto.tipoMonto,
      amount: dto.monto == null ? null : new Prisma.Decimal(dto.monto),
      generationDay: dto.diaGeneracion,
      dueDay: dto.diaVencimiento,
      scope: dto.alcance,
      // El tipo se guarda tal cual (enum); la torre, como la escribió el administrador.
      scopeValue,
      inactivePolicy: dto.politicaInactivas ?? InactiveUnitPolicy.OMITIR,
      unitIds,
      typeAmounts: typeAmounts.map((t) => ({
        unitType: t.tipo,
        amount: new Prisma.Decimal(t.monto),
      })),
    };
  }

  /** Una regla ACTIVA debe poder generar: monto y al menos una unidad aplicable. */
  private async assertComplete(data: FeeRuleData): Promise<void> {
    const missing: string[] = [];
    if (data.amountType === FeeAmountType.FIJO && data.amount === null)
      missing.push('el monto');

    const applicable = await this.repository.countScopeUnits(data);
    if (applicable === 0) missing.push('unidades aplicables');

    if (data.amountType === FeeAmountType.POR_TIPO_UNIDAD) {
      if (data.typeAmounts.length === 0) {
        missing.push('los montos por tipo de unidad');
      } else if (applicable > 0) {
        const configured = new Set(data.typeAmounts.map((t) => t.unitType));
        const types = await this.repository.scopeUnitTypes(data);
        for (const type of types.filter((t) => !configured.has(t))) {
          missing.push(`el monto para el tipo ${type}`);
        }
      }
    }

    if (missing.length > 0) {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'REGLA_INCOMPLETA',
        `Para activar la regla falta: ${missing.join(', ')}.`,
      );
    }
  }

  private async assertNotDuplicate(
    data: FeeRuleData,
    excludeId?: number,
  ): Promise<void> {
    if (await this.repository.findDuplicate(data, excludeId))
      throw this.duplicate();
  }

  private async guardDuplicate<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof FeeRuleDuplicateError) throw this.duplicate();
      throw error;
    }
  }

  private duplicate(): ApiException {
    return new ApiException(
      HttpStatus.CONFLICT,
      'REGLA_DUPLICADA',
      'Ya existe una regla vigente con el mismo concepto y alcance.',
    );
  }

  private invalid(mensaje: string): ApiException {
    return new ApiException(
      HttpStatus.BAD_REQUEST,
      'SOLICITUD_INVALIDA',
      mensaje,
    );
  }
}
