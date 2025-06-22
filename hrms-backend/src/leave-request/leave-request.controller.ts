import { Controller, Get, Post, Put, Delete, Body, Param, HttpStatus, Res } from '@nestjs/common';
import { LeaveRequestService } from './leave-request.service';
import { Response } from 'express';

// Placeholder for tenantId. In a real app, this would come from authentication.
const DUMMY_TENANT_ID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef'; // Use the same dummy tenant ID

@Controller('leave-requests') // API endpoint prefix
export class LeaveRequestController {
  constructor(private readonly leaveRequestService: LeaveRequestService) {}

  // POST /leave-requests - Submit a new leave request
  @Post()
  async create(@Body() createLeaveRequestDto: any, @Res() res: Response) {
    const tenantId = createLeaveRequestDto.tenantId || DUMMY_TENANT_ID;

    if (!tenantId) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'tenantId is required.' });
    }
    if (!createLeaveRequestDto.employeeId || !createLeaveRequestDto.type || !createLeaveRequestDto.startDate || !createLeaveRequestDto.endDate || !createLeaveRequestDto.reason) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Missing required fields: employeeId, type, startDate, endDate, reason.' });
    }

    try {
      const leaveRequest = await this.leaveRequestService.create(createLeaveRequestDto, tenantId);
      res.status(HttpStatus.CREATED).json(leaveRequest);
    } catch (error) {
      if (error.message.includes('Insufficient') || error.message.includes('date')) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to submit leave request', error: error.message });
    }
  }

  // GET /leave-requests - Get all leave requests for a tenant
  @Get()
  async findAll(@Res() res: Response) {
    const tenantId = DUMMY_TENANT_ID; // From authentication in real app

    try {
      const leaveRequests = await this.leaveRequestService.findAll(tenantId);
      res.status(HttpStatus.OK).json(leaveRequests);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to retrieve leave requests', error: error.message });
    }
  }

  // GET /leave-requests/:id - Get a specific leave request
  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    const tenantId = DUMMY_TENANT_ID; // From authentication in real app

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
  async updateStatus(@Param('id') id: string, @Body('status') status: 'Approved' | 'Rejected', @Res() res: Response) {
    const tenantId = DUMMY_TENANT_ID; // From authentication in real app

    if (!status || (status !== 'Approved' && status !== 'Rejected')) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Status must be "Approved" or "Rejected".' });
    }

    try {
        const updatedRequest = await this.leaveRequestService.updateStatus(id, tenantId, status);
        res.status(HttpStatus.OK).json(updatedRequest);
    } catch (error) {
        if (error.message.includes('not found')) {
            return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
        }
        if (error.message.includes('Insufficient') || error.message.includes('Cannot change status')) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
        }
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to update leave request status', error: error.message });
    }
  }

  // DELETE /leave-requests/:id - Delete a leave request
  @Delete(':id')
  async remove(@Param('id') id: string, @Body('tenantId') tenantId: string, @Res() res: Response) {
    // For DELETE, tenantId needs to be provided in the request body for simplicity now
    if (!tenantId) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'tenantId is required in the request body.' });
    }

    try {
      await this.leaveRequestService.remove(id, tenantId);
      res.status(HttpStatus.NO_CONTENT).send(); // 204 No Content for successful deletion
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to delete leave request', error: error.message });
    }
  }
}