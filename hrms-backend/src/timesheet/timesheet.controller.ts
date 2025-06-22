import { Controller, Get, Post, Put, Delete, Body, Param, HttpStatus, Res, Query } from '@nestjs/common';
import { TimesheetService } from './timesheet.service';
import { Response } from 'express';

// Placeholder for tenantId. In a real app, this would come from authentication.
const DUMMY_TENANT_ID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef'; // Use the same dummy tenant ID

@Controller('timesheets') // API endpoint prefix
export class TimesheetController {
  constructor(private readonly timesheetService: TimesheetService) {}

  // POST /timesheets - Create a new timesheet entry
  @Post()
  async create(@Body() createTimesheetDto: any, @Res() res: Response) {
    const tenantId = createTimesheetDto.tenantId || DUMMY_TENANT_ID;

    if (!tenantId) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'tenantId is required.' });
    }
    if (!createTimesheetDto.employeeId || !createTimesheetDto.date || createTimesheetDto.hours === undefined || !createTimesheetDto.description) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Missing required fields: employeeId, date, hours, description.' });
    }

    try {
      const timesheet = await this.timesheetService.create(createTimesheetDto, tenantId);
      res.status(HttpStatus.CREATED).json(timesheet);
    } catch (error) {
      if (error.message.includes('Hours must be') || error.message.includes('date cannot be in the future')) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
      }
      if (error.message.includes('not found')) { // For employee not found
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to create timesheet entry', error: error.message });
    }
  }

  // GET /timesheets - Get all timesheet entries for a tenant (with optional employeeId filter)
  @Get()
  async findAll(@Query('employeeId') employeeId: string, @Res() res: Response) {
    const tenantId = DUMMY_TENANT_ID; // From authentication in real app

    try {
      const timesheets = await this.timesheetService.findAll(tenantId, employeeId);
      res.status(HttpStatus.OK).json(timesheets);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to retrieve timesheet entries', error: error.message });
    }
  }

  // GET /timesheets/:id - Get a specific timesheet entry
  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    const tenantId = DUMMY_TENANT_ID; // From authentication in real app

    try {
      const timesheet = await this.timesheetService.findOne(id, tenantId);
      res.status(HttpStatus.OK).json(timesheet);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to retrieve timesheet entry', error: error.message });
    }
  }

  // PUT /timesheets/:id - Update a timesheet entry
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateTimesheetDto: any, @Res() res: Response) {
    const tenantId = updateTimesheetDto.tenantId || DUMMY_TENANT_ID;
    if (!tenantId) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'tenantId is required in the request body or via authentication.' });
    }

    try {
      const timesheet = await this.timesheetService.update(id, updateTimesheetDto, tenantId);
      res.status(HttpStatus.OK).json(timesheet);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      if (error.message.includes('Hours must be') || error.message.includes('date cannot be in the future')) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to update timesheet entry', error: error.message });
    }
  }

  // DELETE /timesheets/:id - Delete a timesheet entry
  @Delete(':id')
  async remove(@Param('id') id: string, @Body('tenantId') tenantId: string, @Res() res: Response) {
    // For DELETE, tenantId needs to be provided in the request body for simplicity now
    if (!tenantId) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'tenantId is required in the request body.' });
    }

    try {
      await this.timesheetService.remove(id, tenantId);
      res.status(HttpStatus.NO_CONTENT).send(); // 204 No Content for successful deletion
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to delete timesheet entry', error: error.message });
    }
  }
}