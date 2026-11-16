import {
  AssemblyStatus,
  assemblyStatus,
  topicStatus,
} from './assembly-status.js';

const at = (iso: string) => new Date(iso);
const topic = {
  opensAt: at('2026-11-18T20:30:00Z'),
  closesAt: at('2026-11-21T20:00:00Z'),
};

describe('topicStatus', () => {
  it('es Borrador mientras la asamblea no se publica, sin importar la hora', () => {
    expect(topicStatus(topic, false, at('2026-11-19T00:00:00Z'))).toBe(
      AssemblyStatus.BORRADOR,
    );
  });

  it('es Programada antes de la apertura', () => {
    expect(topicStatus(topic, true, at('2026-11-18T20:29:59Z'))).toBe(
      AssemblyStatus.PROGRAMADA,
    );
  });

  it('es Abierta desde el instante de apertura hasta antes del cierre', () => {
    expect(topicStatus(topic, true, at('2026-11-18T20:30:00Z'))).toBe(
      AssemblyStatus.ABIERTA,
    );
    expect(topicStatus(topic, true, at('2026-11-21T19:59:59Z'))).toBe(
      AssemblyStatus.ABIERTA,
    );
  });

  it('es Cerrada desde el instante de cierre', () => {
    expect(topicStatus(topic, true, at('2026-11-21T20:00:00Z'))).toBe(
      AssemblyStatus.CERRADA,
    );
  });
});

describe('assemblyStatus', () => {
  const later = {
    opensAt: at('2026-11-25T20:00:00Z'),
    closesAt: at('2026-11-27T20:00:00Z'),
  };

  it('es Abierta si algún tema está abierto', () => {
    expect(
      assemblyStatus([topic, later], true, at('2026-11-19T00:00:00Z')),
    ).toBe(AssemblyStatus.ABIERTA);
  });

  it('es Programada si quedan temas por abrir y ninguno está abierto', () => {
    expect(
      assemblyStatus([topic, later], true, at('2026-11-22T00:00:00Z')),
    ).toBe(AssemblyStatus.PROGRAMADA);
  });

  it('es Cerrada cuando todos los temas cerraron', () => {
    expect(
      assemblyStatus([topic, later], true, at('2026-11-28T00:00:00Z')),
    ).toBe(AssemblyStatus.CERRADA);
  });

  it('es Borrador si no está publicada', () => {
    expect(assemblyStatus([topic], false, at('2026-11-28T00:00:00Z'))).toBe(
      AssemblyStatus.BORRADOR,
    );
  });
});
