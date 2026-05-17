import { IsString, IsOptional, IsUrl, IsEnum, IsArray, MaxLength, ArrayMaxSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

  @ApiProperty({ enum: TipoContenido, default: TipoContenido.ENLACE })
  @IsEnum(TipoContenido)
  tipo_contenido: TipoContenido = TipoContenido.ENLACE;

  @ApiPropertyOptional({ type: [String], example: ['IA', 'Deep Learning'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  etiquetas?: string[];
}
