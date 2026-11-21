import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { ReportePdfRenderer, type ReporteDocumento } from './exportacion.types.js';

// Misma plantilla que el PDF de auditoría de H18 (AuditPdfService).
const GREEN = '#0a2f1f';
const MUTED = '#555555';
const LINEA = '#cccccc';

/** Genera el PDF de cualquier reporte a partir de un ReporteDocumento. */
@Injectable()
export class ReportePdfService extends ReportePdfRenderer {
  render(d: ReporteDocumento): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'LETTER', margin: 50, bufferPages: true });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      try {
        this.encabezado(doc, d);
        for (const linea of d.resumen) {
          doc.fillColor('#000000').fontSize(11).font('Helvetica').text(linea);
        }
        if (d.resumen.length > 0) doc.moveDown();

        if (d.filas.length === 0) {
          doc.fillColor(MUTED).fontSize(11).font('Helvetica-Oblique').text(d.mensajeVacio);
        } else {
          this.tabla(doc, d);
        }
        this.pie(doc);
        doc.end();
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    });
  }

  private encabezado(doc: PDFKit.PDFDocument, d: ReporteDocumento): void {
    doc.fillColor(MUTED).fontSize(9).font('Helvetica').text('Terraplanistas · Reportes');
    doc.moveDown(0.3);
    doc.fillColor(GREEN).fontSize(20).font('Helvetica-Bold').text(d.titulo);
    doc.moveDown(0.5);
    doc.fillColor('#000000').fontSize(11).font('Helvetica');
    doc.text(`Periodo: ${d.periodo}`);
    if (d.seccion) doc.text(`Sección: ${d.seccion}`);
    doc.text(`Generado: ${d.generadoEn}`);
    doc.text(`Administrador: ${d.administrador}`);
    doc.moveDown();
  }

  private tabla(doc: PDFKit.PDFDocument, d: ReporteDocumento): void {
    const x0 = doc.page.margins.left;
    const total = doc.page.width - x0 - doc.page.margins.right;
    const suma = d.columnas.reduce((a, c) => a + c.ancho, 0);
    const anchos = d.columnas.map((c) => (c.ancho / suma) * total);
    const limite = () => doc.page.height - doc.page.margins.bottom;

    const fila = (celdas: string[], cabecera: boolean) => {
      doc.font(cabecera ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
      const alto =
        Math.max(
          ...celdas.map((t, i) => doc.heightOfString(t, { width: anchos[i] - 6 })),
        ) + 6;
      if (doc.y + alto > limite()) {
        doc.addPage();
        if (!cabecera) fila(d.columnas.map((c) => c.titulo), true);
      }
      const y = doc.y;
      let x = x0;
      celdas.forEach((t, i) => {
        doc
          .fillColor(cabecera ? GREEN : '#000000')
          .font(cabecera ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(9)
          .text(t, x + 3, y + 3, {
            width: anchos[i] - 6,
            align: d.columnas[i].alinear ?? 'left',
          });
        x += anchos[i];
      });
      doc
        .moveTo(x0, y + alto)
        .lineTo(x0 + total, y + alto)
        .strokeColor(cabecera ? GREEN : LINEA)
        .lineWidth(cabecera ? 1 : 0.5)
        .stroke();
      doc.x = x0;
      doc.y = y + alto;
    };

    fila(d.columnas.map((c) => c.titulo), true);
    for (const f of d.filas) fila(f, false);
  }

  /** Numeración "Página i de n" en todas las páginas. */
  private pie(doc: PDFKit.PDFDocument): void {
    const { count } = doc.bufferedPageRange();
    for (let i = 0; i < count; i++) {
      doc.switchToPage(i);
      doc.page.margins.bottom = 0; // evita que escribir en el pie cree una página nueva
      doc
        .fillColor(MUTED)
        .fontSize(9)
        .font('Helvetica')
        .text(`Página ${i + 1} de ${count}`, 50, doc.page.height - 40, {
          width: doc.page.width - 100,
          align: 'center',
          lineBreak: false,
        });
    }
  }
}
