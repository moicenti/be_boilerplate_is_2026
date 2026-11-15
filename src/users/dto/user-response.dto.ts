import { ApiProperty } from '@nestjs/swagger';
import { Role, type Unit, type User } from '@PrismaClient';

class UnitResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'A-19' })
  code!: string;

  @ApiProperty({ example: 'Torre A' })
  tower!: string;

  @ApiProperty({ example: 'Torre A, departamento 19' })
  description!: string;

  static from(unit: Unit): UnitResponseDto {
    return {
      id: unit.id,
      code: unit.code,
      tower: unit.tower,
      description: unit.description,
    };
  }
}

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'nestor@example.com', format: 'email' })
  email!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ type: UnitResponseDto, nullable: true })
  unit!: UnitResponseDto | null;

  @ApiProperty({ enum: Role, example: Role.RESIDENTE })
  role!: Role;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  static fromEntity(user: User & { unit?: Unit | null }): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      isActive: user.isActive,
      createdAt: user.createdAt,
      unit: user.unit ? UnitResponseDto.from(user.unit) : null,
      role: user.role,
    };
  }
}