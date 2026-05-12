import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePollDto {
  @ApiProperty({ example: '¿Cuál es tu opción favorita?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  question: string;

  @ApiProperty({ example: ['Opción A', 'Opción B'], minItems: 2, maxItems: 10 })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  options: string[];

  @ApiProperty({ example: '2025-12-31T23:59:00.000Z' })
  @IsDateString()
  closesAt: string;
}
