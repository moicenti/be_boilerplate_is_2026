/**
 * Validación de variables de entorno.
 *
 * Se ejecuta durante el arranque de ConfigModule: si falta algo o tiene un
 * valor inválido, la aplicación falla de inmediato con un mensaje claro en
 * lugar de reventar más tarde con un error críptico en la primera request.
 */

export interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  REFRESH_TOKEN_EXPIRES_IN_DAYS: number;
  BCRYPT_SALT_ROUNDS: number;
  /** Zona horaria IANA en la que se interpretan los horarios de las áreas. */
  APP_TIMEZONE: string;
  /** Espera de la pasarela de pago simulada (H1), en milisegundos. */
  PAGO_SIMULADO_ESPERA_MS: number;
  /**
   * Proxies delante de la app (Render = 1). Con 0 no se confía en
   * X-Forwarded-For; mal configurado, el rate limit agrupa a todos en una IP.
   */
  TRUST_PROXY_HOPS: number;
  /** Orígenes del frontend con permiso CORS. Vacío = solo mismo origen. */
  CORS_ORIGINS: string[];
}

const requiredVars = ['DATABASE_URL', 'JWT_SECRET'] as const;

/**
 * Lee una variable como string. process.env siempre entrega strings, pero el
 * objeto llega tipado como `unknown`, así que se valida en vez de castear.
 */
function readString(
  raw: Record<string, unknown>,
  key: string,
  fallback: string,
): string {
  const value = raw[key];
  if (value === undefined || value === '') return fallback;

  if (typeof value !== 'string') {
    throw new Error(`La variable de entorno ${key} debe ser un string.`);
  }
  return value;
}

function readInt(
  raw: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  const value = raw[key];
  if (value === undefined || value === '') return fallback;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(
      `La variable de entorno ${key} debe ser un entero positivo.`,
    );
  }
  return parsed;
}

function readNonNegativeInt(
  raw: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  const value = raw[key];
  if (value === undefined || value === '') return fallback;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(
      `La variable de entorno ${key} debe ser un entero mayor o igual a 0.`,
    );
  }
  return parsed;
}

export function validateEnv(raw: Record<string, unknown>): EnvConfig {
  const missing = requiredVars.filter((key) => !raw[key]);
  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno obligatorias: ${missing.join(', ')}. ` +
        'Copiá .env.example a .env y completalas.',
    );
  }

  const jwtSecret = readString(raw, 'JWT_SECRET', '');
  if (jwtSecret.length < 32) {
    throw new Error(
      'JWT_SECRET debe tener al menos 32 caracteres. Generá uno con: openssl rand -base64 32',
    );
  }

  const timezone = readString(raw, 'APP_TIMEZONE', 'America/El_Salvador');
  try {
    new Intl.DateTimeFormat('es', { timeZone: timezone });
  } catch {
    throw new Error(
      `APP_TIMEZONE "${timezone}" no es una zona horaria IANA válida (ej. America/El_Salvador).`,
    );
  }

  // Se exige el origen exacto (esquema + host + puerto, sin barra final).
  const corsOrigins = readString(raw, 'CORS_ORIGINS', '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  for (const origin of corsOrigins) {
    let parsed: string | undefined;
    try {
      parsed = new URL(origin).origin;
    } catch {
      parsed = undefined;
    }
    if (parsed !== origin) {
      throw new Error(
        `CORS_ORIGINS: "${origin}" no es un origen válido (ej. https://mi-front.onrender.com).`,
      );
    }
  }

  return {
    NODE_ENV: readString(raw, 'NODE_ENV', 'development'),
    PORT: readInt(raw, 'PORT', 3000),
    DATABASE_URL: readString(raw, 'DATABASE_URL', ''),
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: readString(raw, 'JWT_EXPIRES_IN', '15m'),
    REFRESH_TOKEN_EXPIRES_IN_DAYS: readInt(raw, 'REFRESH_TOKEN_EXPIRES_IN_DAYS', 7),
    BCRYPT_SALT_ROUNDS: readInt(raw, 'BCRYPT_SALT_ROUNDS', 12),
    APP_TIMEZONE: timezone,
    PAGO_SIMULADO_ESPERA_MS: readNonNegativeInt(raw, 'PAGO_SIMULADO_ESPERA_MS', 5000),
    TRUST_PROXY_HOPS: readNonNegativeInt(raw, 'TRUST_PROXY_HOPS', 0),
    CORS_ORIGINS: corsOrigins,
  };
}
