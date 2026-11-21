import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReporteIncidenciasService } from './reporte-incidencias.service.js';

describe('ReporteIncidenciasService (H28)', () => {
  const prisma = { $queryRaw: vi.fn() };
  const secciones = { existe: vi.fn() };
  let service: ReporteIncidenciasService;

  beforeEach(() => {
    vi.resetAllMocks();
    secciones.existe.mockResolvedValue(true);
    service = new ReporteIncidenciasService(prisma as never, secciones as never);
  });

  it('agrupa por estado y prioridad, calcula días abierta y ordena de la más antigua a la más reciente', async () => {
    prisma.$queryRaw.mockResolvedValue([
      {
        id: 'rep-1',
        folio: 'INC-000001',
        titulo: 'Fuga de agua en pasillo',
        categoria: 'Plomería',
        ubicacion: 'Piso 2',
        unidad: 'A-19',
        seccion: 'Torre A',
        estado: 'ABIERTO',
        prioridad: 'CRITICA',
        fecha_creacion: new Date('2026-11-01T10:00:00Z'),
        dias_abierta: 5,
      },
      {
        id: 'rep-2',
        folio: 'INC-000002',
        titulo: 'Luminaria fundida en lobby',
        categoria: 'Electricidad',
        ubicacion: 'Lobby',
        unidad: 'B-103',
        seccion: 'Torre B',
        estado: 'EN_PROCESO',
        prioridad: 'MEDIA',
        fecha_creacion: new Date('2026-11-05T10:00:00Z'),
        dias_abierta: 1,
      },
    ]);

    const res = await service.obtenerReporte({ desde: '2026-11-01', hasta: '2026-11-10' });

    expect(res.total).toBe(2);
    expect(res.porEstado).toEqual({ ABIERTO: 1, EN_PROCESO: 1 });
    expect(res.porPrioridad).toMatchObject({ CRITICA: 1, MEDIA: 1, ALTA: 0, BAJA: 0 });
    expect(res.lista[0].diasAbierta).toBe(5);
  });

  it('devuelve total 0 y lista vacía cuando no hay incidencias abiertas', async () => {
    prisma.$queryRaw.mockResolvedValue([]);
    const res = await service.obtenerReporte({ desde: '2026-11-01', hasta: '2026-11-10' });
    expect(res.total).toBe(0);
    expect(res.lista).toEqual([]);
  });

  it('rechaza con 400 FILTROS_INVALIDOS si desde > hasta o sección inexistente', async () => {
    await expect(
      service.obtenerReporte({ desde: '2026-11-20', hasta: '2026-11-01' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    secciones.existe.mockResolvedValue(false);
    await expect(
      service.obtenerReporte({ desde: '2026-11-01', hasta: '2026-11-10', seccion: 'Torre Z' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});