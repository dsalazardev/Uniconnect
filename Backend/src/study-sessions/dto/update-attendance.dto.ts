import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAttendanceDto {
  @ApiProperty({ enum: ['CONFIRMED', 'DECLINED', 'PENDING'] })
  @IsIn(['CONFIRMED', 'DECLINED', 'PENDING'])
  status: 'CONFIRMED' | 'DECLINED' | 'PENDING';
}
