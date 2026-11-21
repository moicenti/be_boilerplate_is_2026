import { NotFoundException, ServiceUnavailableException, BadRequestException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { extractText, getDocumentProxy } from 'unpdf';
import { ReporteExportacionService } from './exportacion.service.js';
import { ReportePdfService } from './reporte-pdf.service.js';
import { formatearFecha, formatearFechaHora, formatearMonto } from './formato-fecha.js';

const texto = async (buffer: Buffer) => {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  return (await extractText(pdf, { mergePages: true })).text;
};

describe('formato-fecha', () => {
  it('formatea fecha, hora de El Salvador y monto', () => {
    expect(formatearFecha('2026-11-01')).toBe('01/11/2026');
    // 03:00 UTC del 21 = 21:00 del 20 en El Salvador
    expect(formatearFechaHora(new Date('2026-11-21T03:00:00Z'))).toBe('20/11/2026 21:00');
    expect(formatearMonto(4820)).toBe('$4,820.00');
  });
});

describe('ReporteExportacionService', () => {
  const prisma = { user: { findUnique: vi.fn() } };
  const resumen = { obtener: vi.fn() };
  const incidencias = { obtenerReporte: vi.fn() };
  let servicio: ReporteExportacionService;
  const sesion = { id: 'u-1' };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-20T20:35:00Z')); // 14:35 en El Salvador
    prisma.user.findUnique.mockResolvedValue({ email: 'admin@terraplanistas.test' });
    resumen.obtener.mockResolvedValue({
      morosidad: { porcentaje: 12.5, monto: 4820 },
      ocupacion: { porcentaje: 38.2 },
      incidencias: { cantidad: 7 },
      participacion: { estado: 'no_disponible' },
    });
    incidencias.obtenerReporte.mockResolvedValue({
      total: 1,
      porEstado: { ABIERTO: 1, EN_PROCESO: 0 },
      porPrioridad: {},
      lista: [
        {
          id: 'x', folio: 'INC-001', titulo: 'Fuga de agua', categoria: 'Plomería',
          ubicacion: 'Pasillo', unidad: 'A-101', seccion: '3', estado: 'ABIERTO',
          prioridad: 'ALTA', fechaCreacion: new Date('2026-11-05T15:00:00Z'), diasAbierta: 15,
        },
      ],
    });
    servicio = new ReporteExportacionService(
      prisma as never,
      resumen as never,
      incidencias as never,
      new ReportePdfService(),
    );
  });

  afterEach(() => vi.useRealTimers());

  it('resumen: PDF con administrador, periodo, valores y "No disponible"', async () => {
    const q = { desde: '2026-11-01', hasta: '2026-11-30', seccion: '3' };
    const { buffer, nombreArchivo } = await servicio.exportar('resumen', q, sesion);
    const t = await texto(buffer);

    expect(nombreArchivo).toBe('reporte-resumen-2026-11-01_2026-11-30.pdf');
    expect(resumen.obtener).toHaveBeenCalledWith(q);
    for (const e of [
      'Panel general de indicadores', 'admin@terraplanistas.test',
      '01/11/2026 al 30/11/2026', '20/11/2026 14:35', 'Sección: 3',
      '12.5 %', '$4,820.00', '38.2 %', 'No disponible',
    ]) {
      expect(t).toContain(e);
    }
  });

  it('incidencias: usa el mismo servicio de la pantalla y lista las filas', async () => {
    const q = { desde: '2026-11-01', hasta: '2026-11-30' };
    const { buffer } = await servicio.exportar('incidencias', q, sesion);
    const t = await texto(buffer);

    expect(incidencias.obtenerReporte).toHaveBeenCalledWith(q);
    for (const e of ['INC-001', 'Fuga de agua', 'A-101', 'ALTA', '05/11/2026', 'Total: 1']) {
      expect(t).toContain(e);
    }
  });

  it('incidencias sin filas: mensaje de "Sin datos"', async () => {
    incidencias.obtenerReporte.mockResolvedValue({ total: 0, porEstado: {}, porPrioridad: {}, lista: [] });
    const { buffer } = await servicio.exportar('incidencias', {}, sesion);
    expect(await texto(buffer)).toContain('Sin datos para el periodo y la sección seleccionados');
  });

  it('sin filtros usa el mes en curso en el nombre y el periodo', async () => {
    const { nombreArchivo } = await servicio.exportar('resumen', {}, sesion);
    expect(nombreArchivo).toBe('reporte-resumen-2026-11-01_2026-11-20.pdf');
  });

  it('tipo inexistente: 404 REPORTE_INEXISTENTE y no consulta nada', async () => {
    const p = servicio.exportar('ventas', {}, sesion);
    await expect(p).rejects.toBeInstanceOf(NotFoundException);
    await expect(p).rejects.toMatchObject({ response: { codigo: 'REPORTE_INEXISTENTE' } });
    expect(resumen.obtener).not.toHaveBeenCalled();
  });

  it('filtros inválidos: el 400 del servicio de consulta se propaga', async () => {
    resumen.obtener.mockRejectedValue(
      new BadRequestException({ codigo: 'FILTROS_INVALIDOS', mensaje: 'x' }),
    );
    await expect(servicio.exportar('resumen', { desde: 'hoy' }, sesion)).rejects.toMatchObject({
      response: { codigo: 'FILTROS_INVALIDOS' },
    });
  });

  it.each(['morosidad', 'areas-comunes', 'votaciones'])(
    '%s aún sin servicio de consulta: 503 REPORTE_NO_DISPONIBLE',
    async (tipo) => {
      const p = servicio.exportar(tipo, {}, sesion);
      await expect(p).rejects.toBeInstanceOf(ServiceUnavailableException);
      await expect(p).rejects.toMatchObject({ response: { codigo: 'REPORTE_NO_DISPONIBLE' } });
    },
  );
});
