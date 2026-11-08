import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MethodNotAllowedException } from '@nestjs/common';
import { ComunicadosController } from './comunicados.controller.js';
import { ComunicadosService } from '../services/index.js';

describe('ComunicadosController (Inmutabilidad H19)', () => {
  let controller: ComunicadosController;
  let service: ComunicadosService;

  beforeEach(() => {
    service = {} as unknown as ComunicadosService;
    controller = new ComunicadosController(service);
  });

  it('debe responder con MethodNotAllowedException (405) al intentar alterar un comunicado', () => {
    expect(() => controller.bloquearEdicion()).toThrow(MethodNotAllowedException);
  });
});