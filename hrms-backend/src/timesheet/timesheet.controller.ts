import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { TimesheetService } from './timesheet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('timesheets')
export class TimesheetController {
  constructor(private readonly timesheetService: TimesheetService) {}

  @Post()
  create(@Req() req: Request, @Body() createTimesheetDto: any) {
    const tenantId = req.user.tenantId;
    return this.timesheetService.create(createTimesheetDto, tenantId);
  }

  @Get()
  findAll(@Req() req: Request, @Query('employeeId') employeeId?: string) {
    const tenantId = req.user.tenantId;
    return this.timesheetService.findAll(tenantId, employeeId);
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.timesheetService.findOne(id, tenantId);
  }

  @Put(':id')
  update(@Req() req: Request, @Param('id') id: string, @Body() updateTimesheetDto: any) {
    const tenantId = req.user.tenantId;
    return this.timesheetService.update(id, updateTimesheetDto, tenantId);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.timesheetService.remove(id, tenantId);
  }
}