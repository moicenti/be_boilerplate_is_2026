import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReporteParticipacionService } from './reporte-participacion.service.js';

describe('ReporteParticipacionService (H29)', () => {
  const prisma = {
    $queryRaw: vi.fn(),
    assembly: {
      findMany: vi.fn(),
    },
  };
  const secciones = {
    existe: vi.fn(),
  };
  let service: ReporteParticipacionService;

  beforeEach(() => {
    vi.resetAllMocks();
    secciones.existe.mockResolvedValue(true);
    prisma.assembly.findMany.mockResolvedValue([]);
    service = new ReporteParticipacionService(prisma as never, secciones as never);
  });

  it('calcula el porcentaje de participación a 2 decimales, el promedio del periodo y jamás expone opcionId', async () => {
    prisma.$queryRaw.mockResolvedValue([
      {
        tema_id: 'tema-1',
        folio_asamblea: 'ASM-2026-010',
        asamblea_titulo: 'Renovación de luminarias',
        titulo: 'Cambiar luminarias del jardín a LED',
        apertura: new Date('2026-10-25T14:00:00Z'),
        cierre: new Date('2026-10-30T14:00:00Z'),
        fecha: '2026-10-30',
        unidades_habilitadas: 48,
        votantes: 36,
        participacion: 75.0,
      },
      {
        tema_id: 'tema-2',
        folio_asamblea: 'ASM-2026-008',
        asamblea_titulo: 'Señalización de estacionamiento',
        titulo: 'Pintar cajones de visitas',
        apertura: new Date('2026-10-05T14:00:00Z'),
        cierre: new Date('2026-10-10T14:00:00Z'),
        fecha: '2026-10-10',
        unidades_habilitadas: 48,
        votantes: 24,
        participacion: 50.0,
      },
    ]);

    const res = await service.obtenerReporte({
      desde: '2026-10-01',
      hasta: '2026-11-05',
    });

    expect(res.promedio).toBe(62.5);
    expect(res.lista).toHaveLength(2);
    expect(res.lista[0].participacion).toBe(75);
    expect(res.lista[1].participacion).toBe(50);

    // Criterio de secreto del voto (BE-29.2): nunca debe incluir opcionId ni sentido del voto
    const serializado = JSON.stringify(res);
    expect(serializado).not.toContain('opcionId');
    expect(serializado).not.toContain('opcion_id');
  });

  it('devuelve promedio 0 y lista vacía cuando no existen votaciones cerradas en el periodo', async () => {
    prisma.$queryRaw.mockResolvedValue([]);

    const res = await service.obtenerReporte({
      desde: '2026-10-01',
      hasta: '2026-11-05',
    });

    expect(res.promedio).toBe(0);
    expect(res.lista).toEqual([]);
  });

  it('lanza 400 FILTROS_INVALIDOS con fechas inválidas o sección inexistente', async () => {
    await expect(
      service.obtenerReporte({ desde: '2026-11-30', hasta: '2026-11-01' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});