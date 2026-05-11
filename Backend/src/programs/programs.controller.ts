import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProgramDto } from './dto/create-program.dto';

@ApiTags('programs')
@Controller('programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Crear un nuevo programa académico' })
  create(@Body() createProgramDto: CreateProgramDto) {
    return this.programsService.create(createProgramDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los programas (público — requerido en onboarding de nuevos usuarios)' })
  findAll() {
    return this.programsService.findAll();
  }
}