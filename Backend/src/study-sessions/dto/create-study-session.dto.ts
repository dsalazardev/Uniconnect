import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsInt,
  IsIn,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStudySessionDto {
  @ApiProperty({ example: 'Repaso de Álgebra Lineal' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'Capítulos 3 y 4, traer calculadora' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: '2026-06-10T14:00:00.000Z' })
  @IsDateString()
  startDatetime: string;

  @ApiProperty({ example: 90, description: 'Duración en minutos' })
  @IsInt()
  @Min(1)
  durationMinutes: number;

  @ApiProperty({ enum: ['NONE', 'WEEKLY'], default: 'NONE' })
  @IsIn(['NONE', 'WEEKLY'])
  recurrenceType: 'NONE' | 'WEEKLY';

  @ApiPropertyOptional({ example: '2026-08-31T23:59:00.000Z' })
  @ValidateIf((o) => o.recurrenceType === 'WEEKLY')
  @IsNotEmpty()
  @IsDateString()
  recurrenceEndDate?: string;
}
