import { BadRequestException, Logger } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ResumenService } from './resumen.service.js';
import {
  esFechaValida,
  hoyEnElSalvador,
  primerDiaDelMes,
} from './filtros-resumen.js';
import {
  FuenteNoDisponibleError,
  IncidenciasIndicador,
  MorosidadIndicador,
  OcupacionIndicador,
  ParticipacionIndicador,
} from './indicadores/index.js';

describe('filtros-resumen', () => {
  it('esFechaValida acepta fechas reales y rechaza el resto', () => {
    expect(esFechaValida('2026-11-30')).toBe(true);
    expect(esFechaValida('2028-02-29')).toBe(true); // año bisiesto
    expect(esFechaValida('2026-02-30')).toBe(false);
    expect(esFechaValida('2026-13-01')).toBe(false);
    expect(esFechaValida('2026-1-1')).toBe(false);
    expect(esFechaValida('01/11/2026')).toBe(false);
    expect(esFechaValida('')).toBe(false);
  });

  it('hoyEnElSalvador usa UTC-6, no UTC', () => {
    // 03:00 UTC del 17 = 21:00 del 16 en El Salvador
    expect(hoyEnElSalvador(new Date('2026-11-17T03:00:00Z'))).toBe('2026-11-16');
    expect(hoyEnElSalvador(new Date('2026-11-17T06:00:00Z'))).toBe('2026-11-17');
  });

  it('primerDiaDelMes', () => {
    expect(primerDiaDelMes('2026-11-16')).toBe('2026-11-01');
  });
});

describe('ResumenService', () => {
  const secciones = { existe: vi.fn() };
  const morosidad = { calcular: vi.fn() };
  const ocupacion = { calcular: vi.fn() };
  const incidencias = { calcular: vi.fn() };
  const participacion = { calcular: vi.fn() };
  let service: ResumenService;
  let warn: ReturnType<typeof vi.spyOn>;
  let error: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-16T21:00:00Z')); // 15:00 del 16 en El Salvador
    warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    error = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    secciones.existe.mockResolvedValue(true);
    morosidad.calcular.mockResolvedValue({ porcentaje: 12.5, monto: 4820.0 });
    ocupacion.calcular.mockResolvedValue({ porcentaje: 38.2 });
    incidencias.calcular.mockResolvedValue({ cantidad: 7 });
    participacion.calcular.mockResolvedValue({ porcentaje: 61.4 });

    service = new ResumenService(
      secciones as never,
      morosidad as never,
      ocupacion as never,
      incidencias as never,
      participacion as never,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('indicadores', () => {
    it('devuelve los 4 indicadores con la forma del contrato', async () => {
      const res = await service.obtener({
        desde: '2026-11-01',
        hasta: '2026-11-30',
        seccion: '3',
      });

      expect(res).toEqual({
        morosidad: { porcentaje: 12.5, monto: 4820 },
        ocupacion: { porcentaje: 38.2 },
        incidencias: { cantidad: 7 },
        participacion: { porcentaje: 61.4 },
      });
    });

    it('pasa los mismos filtros a los 4 indicadores', async () => {
      const filtros = { desde: '2026-11-01', hasta: '2026-11-30', seccion: '3' };

      await service.obtener(filtros);

      for (const i of [morosidad, ocupacion, incidencias, participacion]) {
        expect(i.calcular).toHaveBeenCalledWith(filtros);
      }
    });

    it('si un indicador falla, solo ese sale no_disponible y se registra en el log', async () => {
      ocupacion.calcular.mockRejectedValue(new Error('vista caída'));

      const res = await service.obtener({});

      expect(res.ocupacion).toEqual({ estado: 'no_disponible' });
      expect(res.morosidad).toEqual({ porcentaje: 12.5, monto: 4820 });
      expect(res.incidencias).toEqual({ cantidad: 7 });
      expect(res.participacion).toEqual({ porcentaje: 61.4 });
      expect(error).toHaveBeenCalledWith(expect.stringContaining('ocupacion'));
    });

    it('el detalle del error no llega al cliente', async () => {
      morosidad.calcular.mockRejectedValue(new Error('password=secreto'));

      const res = await service.obtener({});

      expect(JSON.stringify(res)).not.toContain('secreto');
    });

    it('los indicadores se calculan en paralelo: uno que falla no frena a los demás', async () => {
      morosidad.calcular.mockRejectedValue(new Error('x'));

      await service.obtener({});

      expect(ocupacion.calcular).toHaveBeenCalled();
      expect(incidencias.calcular).toHaveBeenCalled();
      expect(participacion.calcular).toHaveBeenCalled();
    });

    it('si fallan todos, responde igual con los 4 no_disponible', async () => {
      for (const i of [morosidad, ocupacion, incidencias, participacion]) {
        i.calcular.mockRejectedValue(new Error('x'));
      }

      const res = await service.obtener({});

      expect(Object.values(res).every((v) => v.estado === 'no_disponible')).toBe(true);
    });

    it('una fuente aún no conectada es una advertencia, no un error', async () => {
      participacion.calcular.mockRejectedValue(
        new FuenteNoDisponibleError('participacion', 'H29'),
      );

      const res = await service.obtener({});

      expect(res.participacion).toEqual({ estado: 'no_disponible' });
      expect(warn).toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
    });
  });

  describe('filtros', () => {
    const rechaza = async (query: Record<string, unknown>) => {
      const intento = service.obtener(query);
      await expect(intento).rejects.toBeInstanceOf(BadRequestException);
      await expect(intento).rejects.toMatchObject({
        response: { codigo: 'FILTROS_INVALIDOS' },
      });
      for (const i of [morosidad, ocupacion, incidencias, participacion]) {
        expect(i.calcular).not.toHaveBeenCalled();
      }
    };

    it('sin filtros usa el mes en curso: del día 1 a hoy', async () => {
      await service.obtener({});
      expect(morosidad.calcular).toHaveBeenCalledWith({
        desde: '2026-11-01',
        hasta: '2026-11-16',
      });
    });

    it('desde mayor que hasta: 400 FILTROS_INVALIDOS', async () => {
      await rechaza({ desde: '2026-11-30', hasta: '2026-11-01' });
    });

    it('desde igual a hasta es válido', async () => {
      await expect(
        service.obtener({ desde: '2026-11-10', hasta: '2026-11-10' }),
      ).resolves.toBeDefined();
    });

    it.each([
      ['formato distinto', { desde: '01/11/2026' }],
      ['fecha que no existe', { hasta: '2026-02-30' }],
      ['fecha vacía', { desde: '' }],
      ['parámetro repetido (llega como arreglo)', { desde: ['2026-11-01', '2026-11-02'] }],
    ])('fecha inválida (%s): 400 FILTROS_INVALIDOS', async (_caso, query) => {
      await rechaza(query);
    });

    it('sección inexistente: 400 FILTROS_INVALIDOS', async () => {
      secciones.existe.mockResolvedValue(false);
      await rechaza({ seccion: '99' });
    });

    it.each([['vacía', { seccion: '  ' }], ['arreglo', { seccion: ['1', '2'] }]])(
      'sección %s: 400 FILTROS_INVALIDOS',
      async (_caso, query) => {
        await rechaza(query);
      },
    );

    it('una sección que sí existe se pasa recortada a los indicadores', async () => {
      await service.obtener({ seccion: ' 3 ' });

      expect(secciones.existe).toHaveBeenCalledWith('3');
      expect(morosidad.calcular.mock.calls[0][0].seccion).toBe('3');
    });

    it('sin sección no consulta el catálogo ni agrega el campo', async () => {
      await service.obtener({});

      expect(secciones.existe).not.toHaveBeenCalled();
      expect('seccion' in morosidad.calcular.mock.calls[0][0]).toBe(false);
    });
  });
});

describe('Indicadores pendientes de su fuente', () => {
  const filtros = { desde: '2026-11-01', hasta: '2026-11-30' };

  it.each([
    ['morosidad', new MorosidadIndicador()],
    ['ocupacion', new OcupacionIndicador()],
    ['incidencias', new IncidenciasIndicador()],
    ['participacion', new ParticipacionIndicador()],
  ])('%s lanza FuenteNoDisponibleError hasta que se conecte su fuente', async (_n, indicador) => {
    await expect(indicador.calcular(filtros)).rejects.toBeInstanceOf(
      FuenteNoDisponibleError,
    );
  });
});
