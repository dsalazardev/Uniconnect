import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleLoginDto {
  @ApiProperty({ example: 'ya29.a0AfH...', description: 'Access token obtenido desde Google OAuth' })
  @IsString()
  access_token: string;
}
