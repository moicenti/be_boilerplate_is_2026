import { describe, expect, it } from 'vitest';
import { extractText, getDocumentProxy } from 'unpdf';
import { ReportePdfService } from './reporte-pdf.service.js';
import { MENSAJE_SIN_DATOS, type ReporteDocumento } from './exportacion.types.js';

const base: ReporteDocumento = {
  titulo: 'Incidencias abiertas',
  periodo: '01/11/2026 al 30/11/2026',
  generadoEn: '20/11/2026 14:35',
  administrador: 'admin@terraplanistas.test',
  resumen: ['Total: 2'],
  columnas: [
    { titulo: 'Folio', ancho: 1 },
    { titulo: 'Título', ancho: 3 },
  ],
  filas: [
    ['INC-001', 'Fuga de agua en pasillo'],
    ['INC-002', 'Lámpara dañada'],
  ],
  mensajeVacio: MENSAJE_SIN_DATOS,
};

async function leer(buffer: Buffer) {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text, totalPages } = await extractText(pdf, { mergePages: true });
  return { text, totalPages };
}

describe('ReportePdfService', () => {
  const servicio = new ReportePdfService();

  it('genera un PDF válido', async () => {
    const buffer = await servicio.render(base);
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('incluye título, periodo, fecha de generación, administrador y datos', async () => {
    const { text } = await leer(await servicio.render({ ...base, seccion: '3' }));
    for (const esperado of [
      'Incidencias abiertas',
      '01/11/2026 al 30/11/2026',
      '20/11/2026 14:35',
      'admin@terraplanistas.test',
      'Sección: 3',
      'INC-001',
      'Fuga de agua en pasillo',
      'Lámpara dañada',
      'Página 1 de 1',
    ]) {
      expect(text).toContain(esperado);
    }
    expect(text).not.toContain(MENSAJE_SIN_DATOS);
  });

  it('sin filas imprime el mensaje de sin datos', async () => {
    const { text } = await leer(await servicio.render({ ...base, filas: [], resumen: [] }));
    expect(text).toContain('Sin datos para el periodo y la sección seleccionados');
    expect(text).not.toContain('INC-001');
  });

  it('con muchas filas pagina, repite cabecera y numera "Página i de n"', async () => {
    const filas = Array.from({ length: 120 }, (_, i) => [`INC-${i}`, `Incidencia número ${i}`]);
    const { text, totalPages } = await leer(await servicio.render({ ...base, filas }));
    expect(totalPages).toBeGreaterThan(1);
    expect(text).toContain(`Página 1 de ${totalPages}`);
    expect(text).toContain(`Página ${totalPages} de ${totalPages}`);
    expect(text).toContain('INC-119');
    expect(text.split('Folio').length - 1).toBe(totalPages);
  });
});
