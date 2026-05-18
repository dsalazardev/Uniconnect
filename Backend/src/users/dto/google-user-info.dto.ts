import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ProfileUpdateDto {
  @ApiPropertyOptional({ type: String, nullable: true, example: '5', description: 'Semestre actual del estudiante' })
  @IsString()
  @IsOptional()
  current_semester?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'data:image/jpeg;base64,...', description: 'Foto de perfil en base64 o URL' })
  @IsString()
  @IsOptional()
  image?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: '+573001234567', description: 'Número de teléfono de contacto' })
  @IsString()
  @IsOptional()
  phone?: string | null;
}
