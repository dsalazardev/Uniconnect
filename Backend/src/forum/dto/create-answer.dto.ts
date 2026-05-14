import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAnswerDto {
  @ApiProperty({ example: 'La recursión es cuando una función se llama a sí misma...' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  body: string;
}
