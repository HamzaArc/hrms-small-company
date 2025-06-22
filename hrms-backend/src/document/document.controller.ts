import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { DocumentService } from './document.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@Req() req: Request, @UploadedFile() file: Express.Multer.File, @Body() body: any) {
    const tenantId = req.user.tenantId;
    // In a real app, 'file' would be uploaded to S3/etc. and the path/URL stored.
    // We are simulating this by just storing metadata.
    const createDocumentDto = {
      name: file.originalname,
      path: `simulated/path/${file.filename}`, // Placeholder path
      employeeId: body.employeeId,
      type: body.type,
      issueDate: body.issueDate,
      expiryDate: body.expiryDate,
    };
    return this.documentService.create(createDocumentDto, tenantId);
  }

  @Get()
  findAll(@Req() req: Request, @Query('employeeId') employeeId?: string) {
    const tenantId = req.user.tenantId;
    return this.documentService.findAll(tenantId, employeeId);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.documentService.remove(id, tenantId);
  }
}