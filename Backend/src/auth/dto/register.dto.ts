import { IsString, IsInt, Min, Max } from 'class-validator';
import { ApiBody, ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({ description: 'Pending registration token issued at auth callback for new users' })
    @IsString()
    pending_token: string;

    @ApiProperty({ description: 'Academic program ID' })
    @IsInt()
    @Min(1)
    id_program: number;

    @ApiProperty({ description: 'Current semester (1–12)' })
    @IsInt()
    @Min(1)
    @Max(12)
    current_semester: number;
}
