import { IsOptional, IsString, IsEnum, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventType } from '../enums/event-type.enum';

export class EventFilters {
  @ApiPropertyOptional({ example: '2026-06-10', description: 'Fecha exacta (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be in ISO 8601 format (YYYY-MM-DD)' })
  date?: string;

  @ApiPropertyOptional({ enum: EventType, description: 'Tipo de evento' })
  @IsOptional()
  @IsEnum(EventType, { message: 'type must be one of: CONFERENCIA, TALLER, SEMINARIO, COMPETENCIA, CULTURAL, DEPORTIVO' })
  type?: EventType;

  @ApiPropertyOptional({ example: '2026-06-01', description: 'Inicio del rango de fechas (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'startDate must be in ISO 8601 format (YYYY-MM-DD)' })
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-06-30', description: 'Fin del rango de fechas (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'endDate must be in ISO 8601 format (YYYY-MM-DD)' })
  endDate?: string;
}
