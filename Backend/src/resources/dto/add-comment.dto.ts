import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddCommentDto {
  @ApiProperty({ example: 'Excelente recurso, muy útil para el parcial.' })
  @IsString()
  @MaxLength(1000)
  contenido: string;
}
