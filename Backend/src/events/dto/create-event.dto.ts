import { IsString, IsNotEmpty, IsInt, IsDateString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  id_category: number;

  @ApiProperty({ example: 'Conferencia de Inteligencia Artificial' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title: string;

  @ApiProperty({ example: 'Charla sobre avances en IA aplicada a la educación.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description: string;

  @ApiProperty({ example: 'Auditorio principal, Bloque A' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  location: string;

  @ApiProperty({ example: '2026-06-10T09:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  start_date: string;

  @ApiProperty({ example: '2026-06-10T12:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  end_date: string;
}
