import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PackageStatus } from '@PrismaClient';
import type { PackageWithRelations } from '@Paquetes/repositories';

class PackageUnitDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'A-304' })
  code!: string;

  @ApiProperty({ example: 'Torre A, departamento 304' })
  description!: string;
}

class PackageStaffDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'ricardo.soto@example.com' })
  email!: string;
}

export class PackageResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'PAQ-2026-0187' })
  folio!: string;

  @ApiProperty({ enum: PackageStatus })
  status!: PackageStatus;

  @ApiProperty({ type: PackageUnitDto })
  unit!: PackageUnitDto;

  @ApiProperty()
  recipientName!: string;

  @ApiProperty()
  carrier!: string;

  @ApiProperty()
  trackingReference!: string;

  @ApiProperty()
  description!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  notes!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  receivedAt!: Date;

  @ApiProperty({ type: PackageStaffDto })
  receivedBy!: PackageStaffDto;

  @ApiPropertyOptional({ type: String, nullable: true })
  deliveredTo!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  deliveredAt!: Date | null;

  @ApiPropertyOptional({ type: PackageStaffDto, nullable: true })
  deliveredBy!: PackageStaffDto | null;

  static fromEntity(pkg: PackageWithRelations): PackageResponseDto {
    return {
      id: pkg.id,
      folio: pkg.folio,
      status: pkg.status,
      unit: {
        id: pkg.unit.id,
        code: pkg.unit.code,
        description: pkg.unit.description,
      },
      recipientName: pkg.recipientName,
      carrier: pkg.carrier,
      trackingReference: pkg.trackingReference,
      description: pkg.description,
      notes: pkg.notes,
      receivedAt: pkg.receivedAt,
      receivedBy: { id: pkg.receivedBy.id, email: pkg.receivedBy.email },
      deliveredTo: pkg.deliveredTo,
      deliveredAt: pkg.deliveredAt,
      deliveredBy: pkg.deliveredBy
        ? { id: pkg.deliveredBy.id, email: pkg.deliveredBy.email }
        : null,
    };
  }
}
