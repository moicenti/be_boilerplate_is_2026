import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { promises as fs } from 'node:fs';
import { FileTypeError } from '../errors/file-type.error.js';
import {
  detectFileType,
  extensionFor,
  mimeTypeFor,
  type AllowedFileType,
} from '../utils/file-signature.js';

const removeAll = (files: Express.Multer.File[]) =>
  Promise.allSettled(files.map((f) => fs.unlink(f.path)));

/**
 * Valida los archivos que Multer ya guardó en disco leyendo sus magic bytes,
 * y les pone la extensión y el mimetype reales (los del cliente no se usan).
 *
 * Si alguno no es de un tipo permitido, borra TODOS y responde 400. También
 * los borra si la request falla después (DTO inválido, error del handler),
 * para no dejar archivos huérfanos servidos en /uploads.
 */
export class FileSignatureInterceptor implements NestInterceptor {
  constructor(private readonly allowed: readonly AllowedFileType[]) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest();
    const files: Express.Multer.File[] = request.files ?? [];
    if (files.length === 0) {
      return next.handle();
    }

    try {
      for (const file of files) {
        const buffer = await fs.readFile(file.path);
        const type = detectFileType(buffer, this.allowed);
        const newExt = extensionFor(type);
        const newPath = `${file.path.replace(/\.[^./]+$/, '')}${newExt}`;

        if (file.path !== newPath) {
          await fs.rename(file.path, newPath);
          file.path = newPath;
          file.filename = `${file.filename.replace(/\.[^.]+$/, '')}${newExt}`;
        }

        file.mimetype = mimeTypeFor(type);
      }
    } catch (error) {
      await removeAll(files);
      throw new BadRequestException(
        error instanceof FileTypeError ? error.message : 'Archivo inválido.',
      );
    }

    return next.handle().pipe(
      catchError((error: unknown) =>
        from(removeAll(files)).pipe(switchMap(() => throwError(() => error))),
      ),
    );
  }
}

/** Solo JPG o PNG (fotos de incidencias). */
@Injectable()
export class ImageValidationInterceptor extends FileSignatureInterceptor {
  constructor() {
    super(['jpeg', 'png']);
  }
}
