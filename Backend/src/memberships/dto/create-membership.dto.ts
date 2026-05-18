import { IsInt, IsBoolean, IsOptional, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMembershipDto {
  @ApiProperty({ example: 5, description: 'ID del usuario a agregar al grupo', minimum: 1 })
  @IsInt()
  @Min(1)
  id_user: number;

  @ApiProperty({ example: 12, description: 'ID del grupo', minimum: 1 })
  @IsInt()
  @Min(1)
  id_group: number;

  @ApiPropertyOptional({ example: false, description: 'Si el usuario es administrador del grupo' })
  @IsOptional()
  @IsBoolean()
  is_admin?: boolean;

  @ApiPropertyOptional({ example: '2026-05-17T10:00:00Z', description: 'Fecha de ingreso al grupo' })
  @IsOptional()
  @IsDateString()
  joined_at?: Date;
}
