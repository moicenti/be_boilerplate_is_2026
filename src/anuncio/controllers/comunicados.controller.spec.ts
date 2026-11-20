import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MethodNotAllowedException, ForbiddenException } from '@nestjs/common';
import { ComunicadosController } from './comunicados.controller.js';
import { ComunicadosService } from '../services/index.js';

describe('ComunicadosController (H19 & H20)', () => {
  let controller: ComunicadosController;
  let service: {
    obtenerMuro: ReturnType<typeof vi.fn>;
    obtenerDetalle: ReturnType<typeof vi.fn>;
    marcarComoLeido: ReturnType<typeof vi.fn>;
    publicarComunicado: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    service = {
      obtenerMuro: vi.fn(),
      obtenerDetalle: vi.fn(),
      marcarComoLeido: vi.fn(),
      publicarComunicado: vi.fn(),
    };
    controller = new ComunicadosController(service as unknown as ComunicadosService);
  });

  it('debe responder con MethodNotAllowedException (405) en PUT, PATCH y DELETE', () => {
    expect(() => controller.bloquearPut()).toThrow(MethodNotAllowedException);
    expect(() => controller.bloquearPatch()).toThrow(MethodNotAllowedException);
    expect(() => controller.bloquearDelete()).toThrow(MethodNotAllowedException);
  });

  it('debe delegar la consulta del muro segmentado del residente al servicio', async () => {
    const userMock = { id: 'uuid-1', role: 'RESIDENTE', unitId: 'unit-1' };
    service.obtenerMuro.mockResolvedValue([{ id: 1, titulo: 'Aviso Torre A', leido: false }]);

    const result = await controller.obtenerMuro(userMock);
    expect(service.obtenerMuro).toHaveBeenCalledWith(userMock);
    expect(result).toHaveLength(1);
  });

  it('debe registrar el acuse de lectura y retornar estado leido en true', async () => {
    const userMock = { id: 'uuid-1', role: 'RESIDENTE', unitId: 'unit-1' };
    const respuestaEsperada = {
      comunicadoId: 10,
      leido: true,
      fechaLectura: '2026-11-15T22:00:00.000Z',
    };
    service.marcarComoLeido.mockResolvedValue(respuestaEsperada);

    const result = await controller.marcarComoLeido(10, userMock);
    expect(service.marcarComoLeido).toHaveBeenCalledWith(10, userMock);
    expect(result.leido).toBe(true);
  });

  it('debe rechazar con 403 si un residente intenta publicar un comunicado', async () => {
    const residente = { id: 'uuid-1', role: 'RESIDENTE' };
    await expect(
      controller.crear(residente, {} as any, []),
    ).rejects.toThrow(ForbiddenException);
  });
});