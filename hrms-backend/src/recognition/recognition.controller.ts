import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Query, Res, HttpStatus } from '@nestjs/common';
import { RecognitionService } from './recognition.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request, Response } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('recognitions')
export class RecognitionController {
  constructor(private readonly recognitionService: RecognitionService) {}

  @Post()
  async create(@Req() req: Request, @Res() res: Response, @Body() createRecognitionDto: any) {
    const tenantId = req.user.tenantId;
    try {
      const recognition = await this.recognitionService.create(createRecognitionDto, tenantId);
      res.status(HttpStatus.CREATED).json(recognition);
    } catch (error) {
      // Catch specific errors from service and return appropriate HTTP status
      if (error.message.includes('required') || error.message.includes('characters') || error.message.includes('not found')) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message || 'Failed to create recognition' });
    }
  }

  @Get()
  async findAll(@Req() req: Request, @Res() res: Response, @Query('recipientId') recipientId?: string, @Query('category') category?: string) {
    const tenantId = req.user.tenantId;
    try {
      const recognitions = await this.recognitionService.findAll(tenantId, recipientId, category);
      res.status(HttpStatus.OK).json(recognitions);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message || 'Failed to retrieve recognitions' });
    }
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Res() res: Response, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    try {
      const recognition = await this.recognitionService.findOne(id, tenantId);
      res.status(HttpStatus.OK).json(recognition);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message || 'Failed to retrieve recognition' });
    }
  }

  @Put(':id')
  async update(@Req() req: Request, @Res() res: Response, @Param('id') id: string, @Body() updateRecognitionDto: any) {
    const tenantId = req.user.tenantId;
    try {
      const updatedRecognition = await this.recognitionService.update(id, updateRecognitionDto, tenantId);
      res.status(HttpStatus.OK).json(updatedRecognition);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      if (error.message.includes('characters')) { // Specific check for message length validation
        return res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
      }
      res.status(HttpStatus.BAD_REQUEST).json({ message: error.message || 'Failed to update recognition' });
    }
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Res() res: Response, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    try {
      await this.recognitionService.remove(id, tenantId);
      res.status(HttpStatus.NO_CONTENT).send();
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to delete recognition', error: error.message });
    }
  }
}