import { ReservationStatus } from '@PrismaClient';

export const BLOCKING_RESERVATION_STATUSES: readonly ReservationStatus[] = [
  ReservationStatus.PENDIENTE,
  ReservationStatus.CONFIRMADA,
];

/**
 * Reservas que ocupan un área en la consulta de disponibilidad (H4). Según el diseño solo
 * cuentan las CONFIRMADAS; las PENDIENTES sí impiden bloquear o eliminar el área.
 */
export const OCCUPYING_RESERVATION_STATUSES: readonly ReservationStatus[] = [
  ReservationStatus.CONFIRMADA,
];

/** Duración del intervalo consultado cuando no se indica `duracionMin`. */
export const DEFAULT_AVAILABILITY_DURATION_MIN = 60;

/** Por qué un área no está disponible, en el orden en que se evalúa. */
export const UnavailabilityReason = {
  FUERA_DE_HORARIO: 'FUERA_DE_HORARIO',
  BLOQUEADA: 'BLOQUEADA',
  RESERVADA: 'RESERVADA',
} as const;

export type UnavailabilityReason = (typeof UnavailabilityReason)[keyof typeof UnavailabilityReason];
