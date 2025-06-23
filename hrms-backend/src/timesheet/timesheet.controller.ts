// Ensure there is ONLY ONE import block like this at the very top of the file.
// If you have multiple lines starting with 'import {', combine them or ensure they are unique.
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Query, HttpStatus, Res } from '@nestjs/common';
import { TimesheetService } from './timesheet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request, Response } from 'express'; // Ensure this is also not duplicated and correctly typed

@UseGuards(JwtAuthGuard) // Apply JwtAuthGuard to the entire controller
@Controller('timesheets') // API endpoint prefix
export class TimesheetController {
  constructor(private readonly timesheetService: TimesheetService) {}

  @Post()
  async create(@Req() req: Request, @Body() createTimesheetDto: any, @Res() res: Response) {
    const tenantId = req.user.tenantId;
    try {
        const timesheet = await this.timesheetService.create(createTimesheetDto, tenantId);
        // Ensure res.status is called as a function (which it should be with correct types)
        res.status(HttpStatus.CREATED).json(timesheet); 
    } catch (error) {
        res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
    }
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
  async update(@Req() req: Request, @Param('id') id: string, @Body() updateTimesheetDto: any, @Res() res: Response) {
    const tenantId = req.user.tenantId;
    try {
        const updatedTimesheet = await this.timesheetService.update(id, updateTimesheetDto, tenantId);
        res.status(HttpStatus.OK).json(updatedTimesheet);
    } catch (error) {
        res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
    }
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string, @Res() res: Response) {
    const tenantId = req.user.tenantId;
    try {
        await this.timesheetService.remove(id, tenantId);
        res.status(HttpStatus.NO_CONTENT).send();
    } catch (error) {
        res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
    }
  }

  @Post('by-employee-and-week')
  async findByEmployeeAndWeek(
    @Req() req: Request, 
    @Body('employeeId') employeeId: string, 
    @Body('startDate') startDate: string, 
    @Body('endDate') endDate: string,
    @Res() res: Response
  ) {
    const tenantId = req.user.tenantId;
    if (!employeeId || !startDate || !endDate) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'employeeId, startDate, and endDate are required.' });
    }
    try {
      const timesheets = await this.timesheetService.findAllByEmployeeAndDateRange(employeeId, startDate, endDate, tenantId);
      res.status(HttpStatus.OK).json(timesheets);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to retrieve timesheets for the specified week', error: error.message });
    }
  }
}