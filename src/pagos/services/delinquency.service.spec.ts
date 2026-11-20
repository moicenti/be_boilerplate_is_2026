import type { ConfigService } from '@nestjs/config';
import { Prisma } from '@PrismaClient';
import type { EnvConfig } from '@Config';
import type {
  DelinquencyRepository,
  DelinquentUnitInfo,
} from '../repositories/index.js';
import type { UnitFeeBalance } from '../utils/index.js';
import {
  DelinquencyService,
  type DelinquencyQuery,
} from './delinquency.service.js';

// 5 nov 2026, 11:10 en El Salvador (UTC-6).
const NOW = new Date('2026-11-05T17:10:00Z');

const fee = (unitId: string, due: string, amount = 100): UnitFeeBalance => ({
  unitId,
  status: 'PENDIENTE',
  dueDate: new Date(`${due}T00:00:00Z`),
  amount: new Prisma.Decimal(amount),
  paid: new Prisma.Decimal(0),
});

const info = (
  id: string,
  code: string,
  responsible: string | null = `${code.toLowerCase()}@x.com`,
): DelinquentUnitInfo => ({ id, code, tower: `Torre ${code[0]}`, responsible });

describe('DelinquencyService', () => {
  let repository: {
    findOverdueFees: ReturnType<typeof vi.fn>;
    findUnitsInfo: ReturnType<typeof vi.fn>;
  };
  let service: DelinquencyService;

  const list = (query: Partial<DelinquencyQuery> = {}, now = NOW) =>
    service.list({ page: 1, pageSize: 20, sort: '-diasAtraso', ...query }, now);

  beforeEach(() => {
    repository = {
      // B-205: desde ago (87 días), 3 cuotas · A-202: desde sep, 2 cuotas, 4800
      // A-304: desde oct, 1 cuota, 2400 · sin residente.
      findOverdueFees: vi
        .fn()
        .mockResolvedValue([
          fee('b205', '2026-08-10', 2400),
          fee('b205', '2026-09-10', 2400),
          fee('b205', '2026-10-10', 2400),
          fee('a202', '2026-09-10', 2400),
          fee('a202', '2026-10-10', 2400),
          fee('a304', '2026-10-10', 2400),
        ]),
      findUnitsInfo: vi
        .fn()
        .mockResolvedValue([
          info('b205', 'B-205'),
          info('a202', 'A-202'),
          info('a304', 'A-304', null),
        ]),
    };
    const config = {
      get: () => 'America/El_Salvador',
    } as unknown as ConfigService<EnvConfig, true>;
    service = new DelinquencyService(
      repository as unknown as DelinquencyRepository,
      config,
    );
  });

  it('por defecto, de la mayor a la menor antigüedad, con los datos de cada unidad', async () => {
    const page = await list();

    expect(page).toMatchObject({
      total: 3,
      page: 1,
      pageSize: 20,
      today: '2026-11-05',
    });
    expect(page.items.map((u) => u.code)).toEqual(['B-205', 'A-202', 'A-304']);
    expect(page.items[0]).toMatchObject({
      unitId: 'b205',
      tower: 'Torre B',
      responsible: 'b-205@x.com',
      since: '2026-08-10',
      daysLate: 87,
      overdueFees: 3,
    });
    expect(page.items[0].amountOwed.toFixed(2)).toBe('7200.00');
    expect(repository.findOverdueFees).toHaveBeenCalledWith(
      '2026-11-05',
      undefined,
    );
  });

  it('"hoy" es la fecha del condominio, no la UTC', async () => {
    // 6 nov 03:00 UTC sigue siendo 5 nov en El Salvador.
    const page = await list({}, new Date('2026-11-06T03:00:00Z'));
    expect(page.today).toBe('2026-11-05');
  });

  it('pasa la torre al repositorio', async () => {
    await list({ tower: 'Torre A' });
    expect(repository.findOverdueFees).toHaveBeenCalledWith(
      '2026-11-05',
      'Torre A',
    );
  });

  it('antigüedad mínima: solo unidades con al menos esos días de atraso', async () => {
    const page = await list({ minDaysLate: 30 });
    expect(page.items.map((u) => u.code)).toEqual(['B-205', 'A-202']);
    expect(page.total).toBe(2);
  });

  it.each([
    ['unidad', ['A-202', 'A-304', 'B-205']],
    ['-unidad', ['B-205', 'A-304', 'A-202']],
    ['diasAtraso', ['A-304', 'A-202', 'B-205']],
    ['enMoraDesde', ['B-205', 'A-202', 'A-304']],
    ['-montoAdeudado', ['B-205', 'A-202', 'A-304']],
    ['cuotasVencidas', ['A-304', 'A-202', 'B-205']],
    ['responsable', ['A-202', 'B-205', 'A-304']], // sin responsable al final
  ])('orden %s', async (sort, codes) => {
    const page = await list({ sort });
    expect(page.items.map((u) => u.code)).toEqual(codes);
  });

  it('empata por código de unidad', async () => {
    repository.findOverdueFees.mockResolvedValue([
      fee('b205', '2026-10-10'),
      fee('a202', '2026-10-10'),
    ]);
    const page = await list({ sort: '-diasAtraso' });
    expect(page.items.map((u) => u.code)).toEqual(['A-202', 'B-205']);
  });

  it('pagina con pagina y tamano; total cuenta todas las páginas', async () => {
    const page = await list({ page: 2, pageSize: 2 });
    expect(page.total).toBe(3);
    expect(page.items.map((u) => u.code)).toEqual(['A-304']);
  });

  it('sin cuotas vencidas, lista vacía y no busca unidades', async () => {
    repository.findOverdueFees.mockResolvedValue([]);
    repository.findUnitsInfo.mockResolvedValue([]);
    expect(await list()).toMatchObject({ total: 0, items: [] });
    expect(repository.findUnitsInfo).toHaveBeenCalledWith([]);
  });
});
