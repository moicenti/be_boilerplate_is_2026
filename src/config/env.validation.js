/**
 * Validación de variables de entorno.
 *
 * Se ejecuta durante el arranque de ConfigModule: si falta algo o tiene un
 * valor inválido, la aplicación falla de inmediato con un mensaje claro en
 * lugar de reventar más tarde con un error críptico en la primera request.
 */
const requiredVars = ['DATABASE_URL', 'JWT_SECRET'];
/**
 * Lee una variable como string. process.env siempre entrega strings, pero el
 * objeto llega tipado como `unknown`, así que se valida en vez de castear.
 */
function readString(raw, key, fallback) {
    const value = raw[key];
    if (value === undefined || value === '')
        return fallback;
    if (typeof value !== 'string') {
        throw new Error(`La variable de entorno ${key} debe ser un string.`);
    }
    return value;
}
function readInt(raw, key, fallback) {
    const value = raw[key];
    if (value === undefined || value === '')
        return fallback;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(`La variable de entorno ${key} debe ser un entero positivo.`);
    }
    return parsed;
}
function readNonNegativeInt(raw, key, fallback) {
    const value = raw[key];
    if (value === undefined || value === '')
        return fallback;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) {
        throw new Error(`La variable de entorno ${key} debe ser un entero mayor o igual a 0.`);
    }
    return parsed;
}
export function validateEnv(raw) {
    const missing = requiredVars.filter((key) => !raw[key]);
    if (missing.length > 0) {
        throw new Error(`Faltan variables de entorno obligatorias: ${missing.join(', ')}. ` +
            'Copiá .env.example a .env y completalas.');
    }
    const jwtSecret = readString(raw, 'JWT_SECRET', '');
    if (jwtSecret.length < 32) {
        throw new Error('JWT_SECRET debe tener al menos 32 caracteres. Generá uno con: openssl rand -base64 32');
    }
    const timezone = readString(raw, 'APP_TIMEZONE', 'America/El_Salvador');
    try {
        new Intl.DateTimeFormat('es', { timeZone: timezone });
    }
    catch {
        throw new Error(`APP_TIMEZONE "${timezone}" no es una zona horaria IANA válida (ej. America/El_Salvador).`);
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
    };
}
