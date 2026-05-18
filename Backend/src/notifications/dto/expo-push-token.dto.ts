import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExpoPushTokenDto {
  @ApiProperty({ example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]', maxLength: 255 })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  token: string;

  @ApiPropertyOptional({ example: 'android', enum: ['android', 'ios', 'web'], maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  platform?: string;
}
