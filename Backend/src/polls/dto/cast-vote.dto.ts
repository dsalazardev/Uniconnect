import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CastVoteDto {
  @ApiProperty({ example: 1, description: 'ID de la opción seleccionada' })
  @IsInt()
  @Min(1)
  optionId: number;
}
