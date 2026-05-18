import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check del servidor' })
  @ApiResponse({ status: 200, description: 'Servidor operativo' })
  HealthCheck(): string {
    return this.appService.getHello();
  }
}
