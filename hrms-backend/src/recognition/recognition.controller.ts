import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { RecognitionService } from './recognition.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('recognitions')
export class RecognitionController {
  constructor(private readonly recognitionService: RecognitionService) {}

  @Post()
  create(@Req() req: Request, @Body() createRecognitionDto: any) {
    const tenantId = req.user.tenantId;
    return this.recognitionService.create(createRecognitionDto, tenantId);
  }

  @Get()
  findAll(@Req() req: Request) {
    const tenantId = req.user.tenantId;
    return this.recognitionService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.recognitionService.findOne(id, tenantId);
  }
}