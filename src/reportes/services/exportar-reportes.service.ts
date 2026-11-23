import { Injectable, NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { FiltrosReportesDto } from '../dto/filtros-reportes.dto.js';
import { ResumenService } from './resumen.service.js';
import { ReporteAreasComunesService } from './reporte-areas-comunes.service.js';

const TIPOS_REPORTE = [
  'resumen',
  'morosidad',
  'areas-comunes',
  'incidencias',
  'votaciones',
];

@Injectable()
export class ExportarReportesService {
  constructor(
    private readonly resumenService: ResumenService,
    private readonly areasComunesService: ReporteAreasComunesService, 
  ) {}

  async generarPdf(
    tipo: string,
    filtros: FiltrosReportesDto,
    adminName: string,
  ): Promise<Buffer> {
    if (!TIPOS_REPORTE.includes(tipo)) {
      throw new NotFoundException({
        codigo: 'REPORTE_INEXISTENTE',
        mensaje: `El tipo de reporte '${tipo}' no existe`,
      });
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Encabezado
      doc
        .fontSize(22)
        .font('Helvetica-Bold')
        .text(this.formatearTitulo(tipo), { align: 'center' });
      doc.moveDown(2);
      doc
        .fontSize(12)
        .font('Helvetica')
        .text(`Periodo: ${filtros.desde} al ${filtros.hasta}`);
      doc.text(`Fecha de generación: ${new Date().toLocaleString('es-ES')}`);
      doc.text(`Administrador: ${adminName}`);
      doc.moveDown(2);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Cuerpo
      if (tipo === 'resumen') {
        this.generarCuerpoResumen(doc, filtros);
      } else if (tipo === 'areas-comunes') {
        this.generarCuerpoAreasComunes(doc, filtros);
      } else {
        doc
          .fontSize(14)
          .text('Sin datos para el periodo y la sección seleccionados.', {
            align: 'center',
            color: 'gray',
          });
      }

      // Pie con numeración
      const total = doc.bufferedPageRange().count;
      for (let i = 0; i < total; i++) {
        doc.switchToPage(i);
        doc
          .fontSize(10)
          .text(`Página ${i + 1} de ${total}`, 50, doc.page.height - 50, {
            align: 'center',
          });
      }
      doc.end();
    });
  }

  private async generarCuerpoAreasComunes(
    doc: PDFDocument.PDFDocument,
    filtros: FiltrosReportesDto,
  ) {
    const filas = await this.areasComunesService.obtener(filtros);
    if (filas.length === 0) {
      doc
        .fontSize(14)
        .text('Sin datos para el periodo y la sección seleccionados.', {
          align: 'center',
          color: 'gray',
        });
      return;
    }
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Ocupación por área', { underline: true });
    doc.moveDown();
    doc.fontSize(11).font('Helvetica');
    doc.text('Área                              Reservas   Horas   Ocupación');
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);
    for (const f of filas) {
      const nombre = f.nombre.padEnd(30, ' ').slice(0, 30);
      doc.text(
        `${nombre}  ${String(f.reservas).padStart(6)}   ${String(f.horasReservadas).padStart(5)}   ${f.porcentaje.toFixed(1)}%`,
      );
    }
  }

  private async generarCuerpoResumen(
    doc: PDFDocument.PDFDocument,
    filtros: FiltrosReportesDto,
  ) {
    const data = await this.resumenService.obtenerResumen(filtros);
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Indicadores del Panel', { underline: true });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica');
    const fmt = (v: any) =>
      v.estado === 'no_disponible' ? 'No disponible (N/D)' : `${v.porcentaje}%`;
    const fmtC = (v: any) =>
      v.estado === 'no_disponible'
        ? 'No disponible (N/D)'
        : `${v.cantidad} incidencias`;
    doc.text(`• Morosidad general: ${fmt(data.morosidad)}`);
    doc.text(`• Ocupación (reservas confirmadas): ${fmt(data.ocupacion)}`);
    doc.text(`• Incidencias no cerradas: ${fmtC(data.incidencias)}`);
    doc.text(`• Participación en votaciones: ${fmt(data.participacion)}`);
  }

  private formatearTitulo(tipo: string): string {
    const t: Record<string, string> = {
      resumen: 'Indicadores Generales',
      morosidad: 'Morosidad',
      'areas-comunes': 'Uso de áreas comunes',
      incidencias: 'Incidencias',
      votaciones: 'Votaciones',
    };
    return t[tipo] || tipo;
  }
}
