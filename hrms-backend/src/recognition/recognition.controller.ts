import { Controller, Get, Post, Put, Delete, Body, Param, HttpStatus, Res, Query } from '@nestjs/common';
import { RecognitionService } from './recognition.service';
import { Response } from 'express';

// Placeholder for tenantId. In a real app, this would come from authentication.
const DUMMY_TENANT_ID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef'; // Use the same dummy tenant ID

@Controller('recognitions') // API endpoint prefix
export class RecognitionController {
  constructor(private readonly recognitionService: RecognitionService) {}

  // POST /recognitions - Create a new recognition
  @Post()
  async create(@Body() createRecognitionDto: any, @Res() res: Response) {
    const tenantId = createRecognitionDto.tenantId || DUMMY_TENANT_ID;

    if (!tenantId) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'tenantId is required.' });
    }
    if (!createRecognitionDto.recipientId || !createRecognitionDto.category || !createRecognitionDto.value || !createRecognitionDto.message || !createRecognitionDto.givenBy) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Missing required fields: recipientId, category, value, message, givenBy.' });
    }

    try {
      const recognition = await this.recognitionService.create(createRecognitionDto, tenantId);
      res.status(HttpStatus.CREATED).json(recognition);
    } catch (error) {
      if (error.message.includes('required fields') || error.message.includes('message must be')) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
      }
      if (error.message.includes('not found')) { // Recipient not found
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to create recognition', error: error.message });
    }
  }

  // GET /recognitions - Get all recognitions for a tenant (with optional recipientId/category filters)
  @Get()
  async findAll(
    @Query('recipientId') recipientId: string,
    @Query('category') category: string,
    @Res() res: Response
  ) {
    const tenantId = DUMMY_TENANT_ID; // From authentication in real app

    try {
      const recognitions = await this.recognitionService.findAll(tenantId, recipientId, category);
      res.status(HttpStatus.OK).json(recognitions);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to retrieve recognitions', error: error.message });
    }
  }

  // GET /recognitions/:id - Get a specific recognition
  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    const tenantId = DUMMY_TENANT_ID; // From authentication in real app

    try {
      const recognition = await this.recognitionService.findOne(id, tenantId);
      res.status(HttpStatus.OK).json(recognition);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to retrieve recognition', error: error.message });
    }
  }

  // PUT /recognitions/:id - Update a recognition
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateRecognitionDto: any, @Res() res: Response) {
    const tenantId = updateRecognitionDto.tenantId || DUMMY_TENANT_ID;
    if (!tenantId) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'tenantId is required in the request body or via authentication.' });
    }

    try {
      const recognition = await this.recognitionService.update(id, updateRecognitionDto, tenantId);
      res.status(HttpStatus.OK).json(recognition);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      if (error.message.includes('message must be')) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to update recognition', error: error.message });
    }
  }

  // DELETE /recognitions/:id - Delete a recognition
  @Delete(':id')
  async remove(@Param('id') id: string, @Body('tenantId') tenantId: string, @Res() res: Response) {
    // For DELETE, tenantId needs to be provided in the request body for simplicity now
    if (!tenantId) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'tenantId is required in the request body.' });
    }

    try {
      await this.recognitionService.remove(id, tenantId);
      res.status(HttpStatus.NO_CONTENT).send(); // 204 No Content for successful deletion
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to delete recognition', error: error.message });
    }
  }
}