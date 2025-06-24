import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Query, UploadedFile, UseInterceptors, Res, HttpStatus } from '@nestjs/common';
import { DocumentService } from './document.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
// No specific DTOs provided for Document, so using 'any' for now.

@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Req() req: Request,
    @Res() res: Response,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any
  ) {
    const tenantId = req.user.tenantId;
    
    const createDocumentDto = {
      employeeId: body.employeeId,
      name: body.name,
      type: body.type,
      // uploadDate will be set by the service
      expiryDate: body.expiryDate,
      status: body.status,
      notes: body.notes,
    };

    try {
      const document = await this.documentService.create(createDocumentDto, tenantId, file);
      res.status(HttpStatus.CREATED).json(document);
    } catch (error) {
      if (error.response?.statusCode === HttpStatus.NOT_FOUND || error.response?.statusCode === HttpStatus.BAD_REQUEST) {
        return res.status(error.response.statusCode).json({ message: error.response.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message || 'Failed to upload document' });
    }
  }

  @Get()
  async findAll(@Req() req: Request, @Res() res: Response, @Query('employeeId') employeeId?: string, @Query('type') type?: string, @Query('status') status?: string) {
    const tenantId = req.user.tenantId;
    try {
      const documents = await this.documentService.findAll(tenantId, employeeId, type, status);
      res.status(HttpStatus.OK).json(documents);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to retrieve documents', error: error.message });
    }
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Res() res: Response, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    try {
      const document = await this.documentService.findOne(id, tenantId);
      res.status(HttpStatus.OK).json(document);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to retrieve document', error: error.message });
    }
  }

  @Put(':id')
  async update(@Req() req: Request, @Res() res: Response, @Param('id') id: string, @Body() updateDocumentDto: any) {
    const tenantId = req.user.tenantId;
    try {
      const updatedDocument = await this.documentService.update(id, updateDocumentDto, tenantId);
      res.status(HttpStatus.OK).json(updatedDocument);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.BAD_REQUEST).json({ message: error.message || 'Failed to update document' });
    }
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Res() res: Response, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    try {
      await this.documentService.remove(id, tenantId);
      res.status(HttpStatus.NO_CONTENT).send();
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to delete document', error: error.message });
    }
  }
}