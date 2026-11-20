import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '@Config';
import { toZonedParts } from '@CommonAreas/utils';
import {
  DelinquencyRepository,
  type DelinquentUnitInfo,
} from '../repositories/index.js';
import { summarizeDelinquency, type DelinquentUnit } from '../utils/index.js';
import type { DelinquencySortField } from '../dto/index.js';

export type DelinquentUnitView = DelinquentUnit &
  Omit<DelinquentUnitInfo, 'id'>;

export interface DelinquencyQuery {
  tower?: string;
  minDaysLate?: number;
  page: number;
  pageSize: number;
  /** Campo de `DelinquencySortField`, con `-` delante si es descendente. */
  sort: string;
}

export interface DelinquencyPage {
  total: number;
  page: number;
  pageSize: number;
  today: string;
  items: DelinquentUnitView[];
}

const COMPARATORS: Record<
  DelinquencySortField,
  (a: DelinquentUnitView, b: DelinquentUnitView) => number
> = {
  unidad: () => 0, // el desempate por código ya ordena por unidad
  responsable: (a, b) =>
    (a.responsible ?? '￿').localeCompare(b.responsible ?? '￿'),
  enMoraDesde: (a, b) => a.since.localeCompare(b.since),
  diasAtraso: (a, b) => a.daysLate - b.daysLate,
  montoAdeudado: (a, b) => a.amountOwed.comparedTo(b.amountOwed),
  cuotasVencidas: (a, b) => a.overdueFees - b.overdueFees,
};

/** H2: unidades en mora. Nada se guarda: se deriva de las cuotas en cada consulta. */
@Injectable()
export class DelinquencyService {
  private readonly timeZone: string;

  constructor(
    private readonly repository: DelinquencyRepository,
    configService: ConfigService<EnvConfig, true>,
  ) {
    this.timeZone = configService.get('APP_TIMEZONE', { infer: true });
  }

  async list(
    query: DelinquencyQuery,
    now = new Date(),
  ): Promise<DelinquencyPage> {
    const today = toZonedParts(now, this.timeZone).date;
    const fees = await this.repository.findOverdueFees(today, query.tower);
    const delinquent = summarizeDelinquency(fees, today).filter(
      (unit) => unit.daysLate >= (query.minDaysLate ?? 0),
    );

    const info = new Map(
      (
        await this.repository.findUnitsInfo(delinquent.map((u) => u.unitId))
      ).map(({ id, ...unit }) => [id, unit]),
    );
    const units: DelinquentUnitView[] = delinquent.flatMap((unit) => {
      const extra = info.get(unit.unitId);
      return extra ? [{ ...unit, ...extra }] : [];
    });

    const descending = query.sort.startsWith('-');
    const field = query.sort.replace(/^-/, '') as DelinquencySortField;
    const compare = COMPARATORS[field];
    units.sort((a, b) => {
      const order = compare(a, b);
      if (order !== 0) return descending ? -order : order;
      const byCode = a.code.localeCompare(b.code);
      return field === 'unidad' && descending ? -byCode : byCode;
    });

    const start = (query.page - 1) * query.pageSize;
    return {
      total: units.length,
      page: query.page,
      pageSize: query.pageSize,
      today,
      items: units.slice(start, start + query.pageSize),
    };
  }
}
