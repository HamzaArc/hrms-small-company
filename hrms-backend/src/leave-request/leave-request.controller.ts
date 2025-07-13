// hrms-backend/src/leave-request/leave-request.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, HttpStatus, Res, UseGuards, Req, Query } from '@nestjs/common';
import { LeaveRequestService } from './leave-request.service';
import { Response, Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto'; // Assuming this DTO is defined
import { IsDateString, IsNotEmpty, IsString, IsEnum } from 'class-validator'; // Added for potential DTOs if not already present

// DTO for update status only (ensure this is defined if not already)
class UpdateLeaveRequestStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(['Approved', 'Rejected'])
  status: 'Approved' | 'Rejected';
}

@UseGuards(JwtAuthGuard)
@Controller('leave-requests')
export class LeaveRequestController {
  constructor(private readonly leaveRequestService: LeaveRequestService) {}

  // NEW POSITION: Place more specific routes BEFORE general :id routes

  // GET /leave-requests/calculate-days - NEW: Endpoint to calculate working days
  @Get('calculate-days')
  async getCalculatedDays(
    @Req() req: Request,
    @Res() res: Response,
    @Query('startDate') startDateString: string,
    @Query('endDate') endDateString: string
  ) {
    const tenantId = req.user.tenantId;
    if (!startDateString || !endDateString) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Start date and end date are required for calculation.' });
    }
    try {
      const startDate = new Date(startDateString);
      const endDate = new Date(endDateString);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Invalid date format provided.' });
      }
      if (endDate < startDate) {
          return res.status(HttpStatus.BAD_REQUEST).json({ message: 'End date must be on or after start date.' });
      }

      // Use the public method from the service
      const calculatedDays = await this.leaveRequestService.getWorkingDaysBetweenDates(startDate, endDate, tenantId);
      res.status(HttpStatus.OK).json({ workingDays: calculatedDays });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message || 'Failed to calculate working days' });
    }
  }

  // POST /leave-requests - Submit a new leave request
  @Post()
  async create(@Req() req: Request, @Body() createLeaveRequestDto: CreateLeaveRequestDto, @Res() res: Response) {
    const tenantId = req.user.tenantId;
    if (!req.user || !tenantId) {
        return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Authentication required and tenantId must be present in token.' });
    }
    // DTO validation will handle missing fields due to ValidationPipe
    try {
      const leaveRequest = await this.leaveRequestService.create(createLeaveRequestDto, tenantId);
      res.status(HttpStatus.CREATED).json(leaveRequest);
    } catch (error) {
      if (error.message.includes('Insufficient') || error.message.includes('date') || error.message.includes('overlap') || error.message.includes('Invalid') || error.message.includes('past')) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to submit leave request', error: error.message });
    }
  }

  // GET /leave-requests - Get all leave requests for a tenant
  @Get()
  async findAll(@Req() req: Request, @Res() res: Response, @Query('employeeId') employeeId?: string) {
    const tenantId = req.user.tenantId;
    if (!req.user || !tenantId) {
        return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Authentication required and tenantId must be present in token.' });
    }
    try {
      const leaveRequests = await this.leaveRequestService.findAll(tenantId, employeeId);
      res.status(HttpStatus.OK).json(leaveRequests);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to retrieve leave requests', error: error.message });
    }
  }

  // GET /leave-requests/:id - Get a specific leave request (MUST be after more specific GETs)
  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string, @Res() res: Response) {
    const tenantId = req.user.tenantId;
    if (!req.user || !tenantId) {
        return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Authentication required and tenantId must be present in token.' });
    }
    try {
      const leaveRequest = await this.leaveRequestService.findOne(id, tenantId);
      res.status(HttpStatus.OK).json(leaveRequest);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to retrieve leave request', error: error.message });
    }
  }

  // PUT /leave-requests/:id/status - Update status (Approve/Reject)
  @Put(':id/status')
  async updateStatus(@Req() req: Request, @Param('id') id: string, @Body() updateStatusDto: UpdateLeaveRequestStatusDto, @Res() res: Response) {
    const tenantId = req.user.tenantId;
    if (!req.user || !tenantId) {
        return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Authentication required and tenantId must be present in token.' });
    }
    try {
        const updatedRequest = await this.leaveRequestService.updateStatus(id, tenantId, updateStatusDto.status);
        res.status(HttpStatus.OK).json(updatedRequest);
    } catch (error) {
        if (error.message.includes('not found')) {
            return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
        }
        if (error.message.includes('already') || error.message.includes('Insufficient')) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
        }
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to update leave request status', error: error.message });
    }
  }

  // DELETE /leave-requests/:id - Delete a leave request
  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string, @Res() res: Response) {
    const tenantId = req.user.tenantId;
    if (!req.user || !tenantId) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Authentication required and tenantId must be present in token.' });
    }
    try {
      await this.leaveRequestService.remove(id, tenantId);
      res.status(HttpStatus.NO_CONTENT).send();
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to delete leave request', error: error.message });
    }
  }
}