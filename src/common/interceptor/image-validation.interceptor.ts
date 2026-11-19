import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { promises as fs } from 'node:fs';
import { detectImageType, extensionFor } from '../utils/file-signature.js';

/**
 * Valida que las imágenes subidas por Multer sean realmente JPG o PNG
 * leyendo sus magic bytes. Si alguna no lo es, borra TODOS los archivos
 * subidos y responde 400.
 */
@Injectable()
export class ImageValidationInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest();
    const files: Express.Multer.File[] = request.files ?? [];

    if (files.length === 0) {
      return next.handle();
    }

    try {
      for (const file of files) {
        const buffer = await fs.readFile(file.path);
        const type = detectImageType(buffer);

        const newExt = extensionFor(type);
        const basePath = file.path.replace(/\.[^.]+$/, '');
        const newPath = `${basePath}${newExt}`;

        if (file.path !== newPath) {
          await fs.rename(file.path, newPath);
          file.path = newPath;
          file.filename = `${file.filename.replace(/\.[^.]+$/, '')}${newExt}`;
        }

        // Forzar mimetype según la firma
        file.mimetype = type === 'jpeg' ? 'image/jpeg' : 'image/png';
      }
    } catch (error) {
      // Limpiar archivos subidos si la validación falla
      await Promise.allSettled(files.map((f) => fs.unlink(f.path).catch(() => undefined)));
      const message = error instanceof Error ? error.message : 'Archivo inválido.';
      throw new BadRequestException(message);
    }

    return next.handle();
  }
}