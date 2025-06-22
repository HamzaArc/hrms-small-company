import { Controller, Get, Post, Put, Delete, Body, Param, HttpStatus, Res, Query } from '@nestjs/common';
import { AnnouncementService } from './announcement.service';
import { Response } from 'express';

// Placeholder for tenantId. In a real app, this would come from authentication.
const DUMMY_TENANT_ID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef'; // Use the same dummy tenant ID

@Controller('announcements') // API endpoint prefix
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  // POST /announcements - Create a new announcement
  @Post()
  async create(@Body() createAnnouncementDto: any, @Res() res: Response) {
    const tenantId = createAnnouncementDto.tenantId || DUMMY_TENANT_ID;

    if (!tenantId) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'tenantId is required.' });
    }
    if (!createAnnouncementDto.title || !createAnnouncementDto.content || !createAnnouncementDto.category || !createAnnouncementDto.author || !createAnnouncementDto.publishDate) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Missing required fields: title, content, category, author, publishDate.' });
    }

    try {
      const announcement = await this.announcementService.create(createAnnouncementDto, tenantId);
      res.status(HttpStatus.CREATED).json(announcement);
    } catch (error) {
      if (error.message.includes('required fields') || error.message.includes('date must be') || error.message.includes('date cannot be')) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to create announcement', error: error.message });
    }
  }

  // GET /announcements - Get all announcements for a tenant (with optional category/priority filters)
  @Get()
  async findAll(
    @Query('category') category: string,
    @Query('priority') priority: string,
    @Res() res: Response
  ) {
    const tenantId = DUMMY_TENANT_ID; // From authentication in real app

    try {
      const announcements = await this.announcementService.findAll(tenantId, category, priority);
      res.status(HttpStatus.OK).json(announcements);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to retrieve announcements', error: error.message });
    }
  }

  // GET /announcements/:id - Get a specific announcement
  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    const tenantId = DUMMY_TENANT_ID; // From authentication in real app

    try {
      const announcement = await this.announcementService.findOne(id, tenantId);
      res.status(HttpStatus.OK).json(announcement);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to retrieve announcement', error: error.message });
    }
  }

  // PUT /announcements/:id - Update an announcement
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateAnnouncementDto: any, @Res() res: Response) {
    const tenantId = updateAnnouncementDto.tenantId || DUMMY_TENANT_ID;
    if (!tenantId) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'tenantId is required in the request body or via authentication.' });
    }

    try {
      const announcement = await this.announcementService.update(id, updateAnnouncementDto, tenantId);
      res.status(HttpStatus.OK).json(announcement);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      if (error.message.includes('date must be') || error.message.includes('date cannot be')) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to update announcement', error: error.message });
    }
  }

  // DELETE /announcements/:id - Delete an announcement
  @Delete(':id')
  async remove(@Param('id') id: string, @Body('tenantId') tenantId: string, @Res() res: Response) {
    // For DELETE, tenantId needs to be provided in the request body for simplicity now
    if (!tenantId) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'tenantId is required in the request body.' });
    }

    try {
      await this.announcementService.remove(id, tenantId);
      res.status(HttpStatus.NO_CONTENT).send(); // 204 No Content for successful deletion
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to delete announcement', error: error.message });
    }
  }
}