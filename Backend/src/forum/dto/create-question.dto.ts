import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateQuestionDto {
  @ApiProperty({ example: '¿Cómo funciona la recursión en Python?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title: string;

  @ApiProperty({ example: 'Estoy tratando de entender la recursión...' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  body: string;
}
