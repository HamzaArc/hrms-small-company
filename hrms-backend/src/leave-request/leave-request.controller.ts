import { Controller, Get, Post, Put, Delete, Body, Param, HttpStatus, Res, UseGuards, Req } from '@nestjs/common'; // Added UseGuards, Req
import { LeaveRequestService } from './leave-request.service';
import { Response, Request } from 'express'; // Added Request from 'express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Import JwtAuthGuard

// REMOVE DUMMY_TENANT_ID - it should not be used in a JWT-secured multi-tenant app
// const DUMMY_TENANT_ID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';

@UseGuards(JwtAuthGuard) // Apply JwtAuthGuard to the entire controller
@Controller('leave-requests') // API endpoint prefix
export class LeaveRequestController {
  constructor(private readonly leaveRequestService: LeaveRequestService) {}

  // POST /leave-requests - Submit a new leave request
  @Post()
  async create(@Req() req: Request, @Body() createLeaveRequestDto: any, @Res() res: Response) {
    // FIX: Get tenantId from the authenticated user payload
    const tenantId = req.user.tenantId;

    // The frontend should not send tenantId in the DTO,
    // and the backend should get it from the authenticated user.
    // So, no need to check createLeaveRequestDto.tenantId
    if (!req.user || !tenantId) { // Basic check for guard functionality
        return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Authentication required and tenantId must be present in token.' });
    }
    if (!createLeaveRequestDto.employeeId || !createLeaveRequestDto.type || !createLeaveRequestDto.startDate || !createLeaveRequestDto.endDate || !createLeaveRequestDto.reason) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Missing required fields: employeeId, type, startDate, endDate, reason.' });
    }

    try {
      const leaveRequest = await this.leaveRequestService.create(createLeaveRequestDto, tenantId);
      res.status(HttpStatus.CREATED).json(leaveRequest);
    } catch (error) {
      if (error.message.includes('Insufficient') || error.message.includes('date') || error.message.includes('overlap')) { // Added overlap
        return res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to submit leave request', error: error.message });
    }
  }

  // GET /leave-requests - Get all leave requests for a tenant
  @Get()
  async findAll(@Req() req: Request, @Res() res: Response) {
    // FIX: Get tenantId from the authenticated user payload
    const tenantId = req.user.tenantId;

    if (!req.user || !tenantId) {
        return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Authentication required and tenantId must be present in token.' });
    }

    try {
      const leaveRequests = await this.leaveRequestService.findAll(tenantId, req.query.employeeId as string); // Added optional employeeId query
      res.status(HttpStatus.OK).json(leaveRequests);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to retrieve leave requests', error: error.message });
    }
  }

  // GET /leave-requests/:id - Get a specific leave request
  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string, @Res() res: Response) {
    // FIX: Get tenantId from the authenticated user payload
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
  async updateStatus(@Req() req: Request, @Param('id') id: string, @Body('status') status: 'Approved' | 'Rejected', @Res() res: Response) {
    // FIX: Get tenantId from the authenticated user payload
    const tenantId = req.user.tenantId;

    if (!req.user || !tenantId) {
        return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Authentication required and tenantId must be present in token.' });
    }
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
  async remove(@Req() req: Request, @Param('id') id: string, @Res() res: Response) {
    // FIX: Get tenantId from the authenticated user payload
    const tenantId = req.user.tenantId;

    if (!req.user || !tenantId) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Authentication required and tenantId must be present in token.' });
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