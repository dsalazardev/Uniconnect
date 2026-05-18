import { IsInt, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteOnboardingDto {
  @ApiProperty({ example: 3, description: 'ID del programa académico del estudiante', minimum: 1 })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  id_program: number;

  @ApiProperty({ example: 4, description: 'Semestre actual del estudiante', minimum: 1 })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  current_semester: number;
}
