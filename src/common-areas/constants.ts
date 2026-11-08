import { ReservationStatus } from '@PrismaClient';

export const BLOCKING_RESERVATION_STATUSES: readonly ReservationStatus[] = [
  ReservationStatus.PENDIENTE,
  ReservationStatus.CONFIRMADA,
];
