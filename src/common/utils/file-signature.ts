import { FileTypeError } from '../errors/file-type.error.js';

// Firmas de archivos comunes (magic bytes)
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export type AllowedImageType = 'jpeg' | 'png';


export function detectImageType(buffer: Buffer): AllowedImageType {
  if (buffer.length < 8) {
    throw new FileTypeError('El archivo es demasiado pequeño para ser una imagen válida.');
  }

  // JPEG: FF D8 FF
  if (
    buffer[0] === JPEG_SIGNATURE[0] &&
    buffer[1] === JPEG_SIGNATURE[1] &&
    buffer[2] === JPEG_SIGNATURE[2]
  ) {
    return 'jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (PNG_SIGNATURE.every((byte, i) => buffer[i] === byte)) {
    return 'png';
  }

  throw new FileTypeError('El archivo no es un JPG o PNG válido.');
}

/** Extensión oficial según el tipo detectado. */
export function extensionFor(type: AllowedImageType): string {
  return type === 'jpeg' ? '.jpg' : '.png';
}