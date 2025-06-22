import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AnnouncementService } from './announcement.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('announcements')
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Post()
  create(@Req() req: Request, @Body() createAnnouncementDto: any) {
    const tenantId = req.user.tenantId;
    return this.announcementService.create(createAnnouncementDto, tenantId);
  }

  @Get()
  findAll(@Req() req: Request) {
    const tenantId = req.user.tenantId;
    return this.announcementService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.announcementService.findOne(id, tenantId);
  }

  @Put(':id')
  update(@Req() req: Request, @Param('id') id: string, @Body() updateAnnouncementDto: any) {
    const tenantId = req.user.tenantId;
    return this.announcementService.update(id, updateAnnouncementDto, tenantId);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.announcementService.remove(id, tenantId);
  }
}