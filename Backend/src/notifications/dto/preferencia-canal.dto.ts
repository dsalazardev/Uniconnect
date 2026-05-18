import { IsBoolean, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PreferenciaCanalDto {
  @ApiProperty({ example: 'event_published', description: 'Clave del tipo de evento', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  tipo_evento: string;

  @ApiProperty({ example: 'push', description: 'Canal de notificación (push, email, in_app)', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  canal: string;

  @ApiProperty({ example: true, description: 'true = activado, false = desactivado' })
  @IsBoolean()
  activo: boolean;
}
