import { IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PaginationParams {
  @ApiProperty({ example: 1, description: 'Número de página (empieza en 1)', minimum: 1 })
  @IsInt()
  @Min(1)
  page: number;

  @ApiProperty({ example: 20, description: 'Elementos por página (máx. 100)', minimum: 1, maximum: 100 })
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number;
}
