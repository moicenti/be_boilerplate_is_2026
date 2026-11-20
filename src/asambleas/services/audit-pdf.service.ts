import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import type { TopicAudit } from './resultados.service.js';

export abstract class AuditDocumentRenderer {
  abstract render(
    audit: TopicAudit,
    format: (date: Date) => string,
  ): Promise<Buffer>;
}

const GREEN = '#0a2f1f';
const MUTED = '#555555';

@Injectable()
export class AuditPdfService extends AuditDocumentRenderer {
  render(audit: TopicAudit, format: (date: Date) => string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const { assembly, topic, results } = audit;

      doc.fillColor(MUTED).fontSize(9).text(`ASAMBLEAS · ${assembly.folio}`);
      doc.fillColor(GREEN).fontSize(20).text('Resultados y auditoría');
      doc.fillColor('black').fontSize(11).text(assembly.title);
      doc
        .fillColor(MUTED)
        .fontSize(9)
        .text(
          `Reunión: ${format(assembly.startsAt)} · ${assembly.location} · Asamblea ${assembly.type.toLowerCase()}`,
        );
      doc.moveDown();

      doc.fillColor(GREEN).fontSize(13).text('Propuesta sometida a votación');
      doc.fillColor('black').fontSize(11).text(topic.title);
      doc.fillColor(MUTED).fontSize(9).text(topic.description);
      doc.text(
        `Votación: ${format(topic.opensAt)} – ${format(topic.closesAt)}`,
      );
      doc.moveDown();

      doc.fillColor(GREEN).fontSize(13).text('Recuento por opción');
      doc.fillColor('black').fontSize(10);
      for (const option of results.options) {
        doc.text(
          `${option.text}: ${option.votes} votos · ${option.percentage.toFixed(2)} %`,
        );
      }
      doc.moveDown(0.5);
      doc.text(`Total emitido: ${results.totalVotes} votos`);
      doc.text(
        `Participación: ${results.unitsVoted} de ${results.eligibleUnits} unidades habilitadas · ${results.participation.toFixed(2)} %`,
      );
      doc.text(
        results.outcome === 'GANADOR'
          ? `Opción ganadora: ${results.winner?.text}`
          : results.outcome === 'EMPATE'
            ? `Empate entre: ${results.tiedOptions.join(', ')}`
            : 'Sin votos registrados',
      );
      doc
        .fillColor(MUTED)
        .fontSize(8)
        .text(
          results.consistent
            ? 'Verificación: la suma de votos coincide con el número de unidades que votaron.'
            : 'Advertencia: la suma de votos no coincide con el número de unidades que votaron.',
        );
      doc.moveDown();

      doc.fillColor(GREEN).fontSize(13).text('Participación por unidad');
      doc
        .fillColor(MUTED)
        .fontSize(8)
        .text(
          'Unidades que votaron y hora de su voto. No incluye la opción elegida.',
        );
      doc.fillColor('black').fontSize(10);
      if (audit.participations.length === 0) {
        doc.text('Ninguna unidad votó.');
      }
      for (const row of audit.participations) {
        doc.text(
          `${row.unitCode} · ${row.unitDescription} — ${format(row.votedAt)}`,
        );
      }
      doc.moveDown();

      doc.fillColor(GREEN).fontSize(13).text('Eventos del proceso');
      doc.fillColor('black').fontSize(10);
      for (const event of audit.events) {
        doc.text(`${format(event.at)} · ${event.event} · ${event.responsible}`);
        doc
          .fillColor(MUTED)
          .fontSize(9)
          .text(event.detail)
          .fillColor('black')
          .fontSize(10);
      }
      doc.moveDown();
      doc
        .fillColor(MUTED)
        .fontSize(8)
        .text(
          'Resultados sin exposición de votos individuales: el sistema guarda los votos sin la unidad que los emitió.',
        );

      doc.end();
    });
  }
}
