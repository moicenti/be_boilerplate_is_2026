import { FileTypeError } from '../errors/file-type.error.js';

// Firmas de archivos comunes (magic bytes)
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-

export type AllowedFileType = 'jpeg' | 'png' | 'pdf';
export type AllowedImageType = Extract<AllowedFileType, 'jpeg' | 'png'>;

const SIGNATURES: Record<AllowedFileType, number[]> = {
  jpeg: JPEG_SIGNATURE,
  png: PNG_SIGNATURE,
  pdf: PDF_SIGNATURE,
};

const LABELS: Record<AllowedFileType, string> = { jpeg: 'JPG', png: 'PNG', pdf: 'PDF' };

const startsWith = (buffer: Buffer, signature: number[]) =>
  signature.every((byte, i) => buffer[i] === byte);

/** Detecta el tipo real por magic bytes; lanza si no es uno de `allowed`. */
export function detectFileType<T extends AllowedFileType>(
  buffer: Buffer,
  allowed: readonly T[],
): T {
  if (buffer.length < 8) {
    throw new FileTypeError('El archivo es demasiado pequeño para ser válido.');
  }

  const type = allowed.find((candidate) => startsWith(buffer, SIGNATURES[candidate]));
  if (!type) {
    const labels = allowed.map((t) => LABELS[t]).join(', ');
    throw new FileTypeError(`El archivo no es un ${labels} válido.`);
  }
  return type;
}

export function detectImageType(buffer: Buffer): AllowedImageType {
  return detectFileType(buffer, ['jpeg', 'png'] as const);
}

/** Extensión oficial según el tipo detectado. */
export function extensionFor(type: AllowedFileType): string {
  return type === 'jpeg' ? '.jpg' : `.${type}`;
}

export function mimeTypeFor(type: AllowedFileType): string {
  return type === 'pdf' ? 'application/pdf' : `image/${type}`;
}
