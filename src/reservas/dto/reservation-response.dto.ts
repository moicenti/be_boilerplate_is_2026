import { ApiProperty } from '@nestjs/swagger';
import { ReservationStatus, type Reservation } from '@PrismaClient';
import { toZonedIso } from '@CommonAreas/utils';

export class ReservationResponseDto {
  @ApiProperty({ example: 77 })
  reservaId!: number;

  @ApiProperty({ example: 2 })
  areaId!: number;

  @ApiProperty({ example: '2026-11-12T18:00:00-06:00' })
  inicio!: string;

  @ApiProperty({ example: '2026-11-12T20:00:00-06:00' })
  fin!: string;

  @ApiProperty({ enum: ReservationStatus, example: ReservationStatus.CONFIRMADA })
  estado!: ReservationStatus;

  static fromEntity(reservation: Reservation, timeZone: string): ReservationResponseDto {
    return {
      reservaId: reservation.id,
      areaId: reservation.areaId,
      inicio: toZonedIso(reservation.startsAt, timeZone),
      fin: toZonedIso(reservation.endsAt, timeZone),
      estado: reservation.status,
    };
  }
}
