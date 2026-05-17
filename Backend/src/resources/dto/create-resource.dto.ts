import { IsString, IsOptional, IsUrl, IsEnum, IsArray, MaxLength, ArrayMaxSize, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TipoContenido } from '@prisma/client';

export class CreateResourceDto {
  @ApiPropertyOptional({ example: 'https://arxiv.org/abs/2106.09685' })
  @IsOptional()
  @IsUrl({}, { message: 'url_externa debe ser una URL válida' })
  @MaxLength(2048)
  url_externa?: string;

  @ApiPropertyOptional({ example: 'Attention is All You Need' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  titulo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descripcion?: string;

  @ApiPropertyOptional({ enum: TipoContenido, default: TipoContenido.ENLACE })
  @IsOptional()
  @IsEnum(TipoContenido)
  tipo_contenido: TipoContenido = TipoContenido.ENLACE;

  @ApiPropertyOptional({ type: [String], example: ['IA', 'Deep Learning'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  etiquetas?: string[];

  /** Grupo opcional para contexto de permisos CA3 */
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  id_group?: number;
}
