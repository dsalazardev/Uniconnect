import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TempLoginDto {
  @ApiProperty({ example: 'google-oauth2|123456789', description: 'Google sub (identificador único del usuario en Google)' })
  @IsString()
  googleSub: string;
}
