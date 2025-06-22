import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { LeaveRequestService } from './leave-request.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto'; // <-- IMPORT THE DTO

@UseGuards(JwtAuthGuard)
@Controller('leave-requests')
export class LeaveRequestController {
  constructor(private readonly leaveRequestService: LeaveRequestService) {}

  @Post()
  // FIX: Use the DTO to validate the request body
  create(@Req() req: Request, @Body() createLeaveRequestDto: CreateLeaveRequestDto) {
    const tenantId = req.user.tenantId;
    return this.leaveRequestService.create(createLeaveRequestDto, tenantId);
  }

  @Get()
  findAll(@Req() req: Request, @Query('employeeId') employeeId?: string) {
    const tenantId = req.user.tenantId;
    return this.leaveRequestService.findAll(tenantId, employeeId);
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.leaveRequestService.findOne(id, tenantId);
  }

  @Put(':id/status')
  updateStatus(@Req() req: Request, @Param('id') id: string, @Body('status') status: 'Approved' | 'Rejected') {
    const tenantId = req.user.tenantId;
    // We will create a DTO for this in a future step
    if (!status || !['Approved', 'Rejected'].includes(status)) {
        throw new Error('Invalid status provided.');
    }
    return this.leaveRequestService.updateStatus(id, tenantId, status);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.leaveRequestService.remove(id, tenantId);
  }
}