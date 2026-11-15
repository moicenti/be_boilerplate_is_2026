import { ApiProperty } from '@nestjs/swagger';
import { Role, type Unit, type User } from '@PrismaClient';

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'nestor@example.com', format: 'email' })
  email!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ type: String, nullable: true, example: 'A-19' })
  unit!: string | null;

  @ApiProperty({ enum: Role, example: Role.RESIDENTE })
  role!: Role;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  static fromEntity(
    user: User & { unit?: Unit | null },
  ): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      isActive: user.isActive,
      createdAt: user.createdAt,
      unit: user.unit?.code ?? null,
      role: user.role,
    };
  }
}