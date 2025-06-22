import { Controller, Get, Post, Put, Delete, Body, Param, HttpStatus, Res, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express'; // Import FileInterceptor
import { DocumentService } from './document.service';
import { Response } from 'express';
import { Express } from 'express'; // Import Express for file typing (Express.Multer.File)

// Placeholder for tenantId. In a real app, this would come from authentication.
const DUMMY_TENANT_ID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef'; // Use the same dummy tenant ID

@Controller('documents') // API endpoint prefix
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  // POST /documents - Upload a new document (with file)
  @Post()
  @UseInterceptors(FileInterceptor('file')) // 'file' is the name of the field in the form data
  async create(
    @UploadedFile() file: Express.Multer.File, // File uploaded
    @Body() createDocumentDto: any, // Other document metadata
    @Res() res: Response
  ) {
    const tenantId = createDocumentDto.tenantId || DUMMY_TENANT_ID;

    if (!tenantId) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'tenantId is required.' });
    }
    if (!createDocumentDto.employeeId || !createDocumentDto.name || !createDocumentDto.type || !createDocumentDto.uploadDate) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Missing required fields: employeeId, name, type, uploadDate.' });
    }
    if (!file && !createDocumentDto.fileUrl) { // Require either a file upload or a fileUrl in body
        return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Either a file must be uploaded or a fileUrl must be provided in the body.' });
    }

    try {
      const document = await this.documentService.create(createDocumentDto, tenantId, file);
      res.status(HttpStatus.CREATED).json(document);
    } catch (error) {
      if (error.message.includes('required fields') || error.message.includes('date must be') || error.message.includes('date cannot be') || error.message.includes('Either a file must be uploaded')) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
      }
      if (error.message.includes('not found')) { // Employee not found
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to upload document', error: error.message });
    }
  }

  // GET /documents - Get all documents for a tenant (with optional filters)
  @Get()
  async findAll(
    @Query('employeeId') employeeId: string,
    @Query('type') type: string,
    @Query('status') status: string,
    @Res() res: Response
  ) {
    const tenantId = DUMMY_TENANT_ID; // From authentication in real app

    try {
      const documents = await this.documentService.findAll(tenantId, employeeId, type, status);
      res.status(HttpStatus.OK).json(documents);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to retrieve documents', error: error.message });
    }
  }

  // GET /documents/:id - Get a specific document
  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    const tenantId = DUMMY_TENANT_ID; // From authentication in real app

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

  // PUT /documents/:id - Update document metadata (not the file itself)
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDocumentDto: any, @Res() res: Response) {
    const tenantId = updateDocumentDto.tenantId || DUMMY_TENANT_ID;
    if (!tenantId) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'tenantId is required in the request body or via authentication.' });
    }

    try {
      const document = await this.documentService.update(id, updateDocumentDto, tenantId);
      res.status(HttpStatus.OK).json(document);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      if (error.message.includes('date must be') || error.message.includes('date cannot be')) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to update document', error: error.message });
    }
  }

  // DELETE /documents/:id - Delete a document and its associated file
  @Delete(':id')
  async remove(@Param('id') id: string, @Body('tenantId') tenantId: string, @Res() res: Response) {
    // For DELETE, tenantId needs to be provided in the request body for simplicity now
    if (!tenantId) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'tenantId is required in the request body.' });
    }

    try {
      await this.documentService.remove(id, tenantId);
      res.status(HttpStatus.NO_CONTENT).send(); // 204 No Content for successful deletion
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to delete document', error: error.message });
    }
  }
}