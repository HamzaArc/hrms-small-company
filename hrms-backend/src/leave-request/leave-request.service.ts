import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { LeaveRequest } from './leave-request.entity';
import { EmployeeService } from '../employee/employee.service';
import { Employee } from '../employee/employee.entity';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';

@Injectable()
export class LeaveRequestService {
  constructor(
    @InjectRepository(LeaveRequest)
    private leaveRequestsRepository: Repository<LeaveRequest>,
    private employeeService: EmployeeService,
  ) {}

  private normalizeDate(date: Date): Date {
    const newDate = new Date(date);
    newDate.setUTCHours(0, 0, 0, 0); // Use UTC to avoid timezone issues
    return newDate;
  }

  private calculateDays(startDate: Date, endDate: Date): number {
    const start = this.normalizeDate(startDate);
    const end = this.normalizeDate(endDate);
    const diffTime = end.getTime() - start.getTime();
    // Add 1 to make the range inclusive
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }

  private getLeaveBalance(employee: Employee, leaveType: string): number {
    const lowerCaseType = leaveType.toLowerCase();
    switch (lowerCaseType) {
      case 'vacation': return employee.vacationBalance;
      case 'sick': return employee.sickBalance;
      case 'personal': return employee.personalBalance;
      default:
        throw new BadRequestException(`Invalid leave type provided: ${leaveType}.`);
    }
  }

  private setLeaveBalance(employee: Employee, leaveType: string, newBalance: number): void {
    const lowerCaseType = leaveType.toLowerCase();
    switch (lowerCaseType) {
      case 'vacation': employee.vacationBalance = newBalance; break;
      case 'sick': employee.sickBalance = newBalance; break;
      case 'personal': employee.personalBalance = newBalance; break;
      default:
        throw new BadRequestException(`Invalid leave type for setting balance: ${leaveType}.`);
    }
  }

  async create(createLeaveRequestDto: CreateLeaveRequestDto, tenantId: string): Promise<LeaveRequest> {
    const { employeeId, type, startDate: startDateString, endDate: endDateString, reason } = createLeaveRequestDto;

    console.log(`--- [LeaveRequestService] Attempting to create leave request for employeeId: ${employeeId} in tenantId: ${tenantId}`);

    const startDate = this.normalizeDate(new Date(startDateString));
    const endDate = this.normalizeDate(new Date(endDateString));
    const today = this.normalizeDate(new Date());

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new BadRequestException('Invalid date format provided.');
    }
    if (endDate < startDate) {
        throw new BadRequestException('End date must be on or after start date.');
    }
    if (startDate < today) {
        throw new BadRequestException('Start date cannot be in the past.');
    }
    
    console.log(`--- [LeaveRequestService] Calling EmployeeService.findOne with employeeId: ${employeeId} and tenantId: ${tenantId}`);
    const employee = await this.employeeService.findOne(employeeId, tenantId);
    console.log(`--- [LeaveRequestService] Employee found successfully.`);

    const existingRequests = await this.leaveRequestsRepository.find({
        where: {
            employeeId: employeeId,
            tenantId: tenantId,
            status: In(['Pending', 'Approved']),
        },
    });

    const hasOverlap = existingRequests.some(existingRequest => {
        const existingStart = this.normalizeDate(existingRequest.startDate);
        const existingEnd = this.normalizeDate(existingRequest.endDate);
        return startDate <= existingEnd && endDate >= existingStart;
    });

    if (hasOverlap) {
        throw new BadRequestException('The requested dates overlap with an existing leave request.');
    }

    const requestedDays = this.calculateDays(startDate, endDate);
    if (requestedDays <= 0) {
        throw new BadRequestException('Leave request must be for at least one day.');
    }

    const currentBalance = this.getLeaveBalance(employee, type);

    if (currentBalance < requestedDays) {
        throw new BadRequestException(`Insufficient ${type} leave days available. Available: ${currentBalance}, Requested: ${requestedDays}.`);
    }

    const newRequestData = {
        employeeId, type, startDate, endDate, reason, tenantId,
        requestedDate: new Date(),
        status: 'Pending',
    };

    const newRequest = this.leaveRequestsRepository.create(newRequestData);
    return this.leaveRequestsRepository.save(newRequest);
  }

  async findAll(tenantId: string, employeeId?: string): Promise<LeaveRequest[]> {
    const whereClause: any = { tenantId };
    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    return this.leaveRequestsRepository.find({
      where: whereClause,
      relations: ['employee'],
      order: { requestedDate: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<LeaveRequest> {
    const request = await this.leaveRequestsRepository.findOne({
      where: { id, tenantId },
      relations: ['employee'],
    });
    if (!request) {
      throw new NotFoundException(`Leave request with ID "${id}" not found for this tenant.`);
    }
    return request;
  }

  async updateStatus(id: string, tenantId: string, newStatus: 'Approved' | 'Rejected'): Promise<LeaveRequest> {
    const request = await this.leaveRequestsRepository.findOne({
      where: { id, tenantId },
      relations: ['employee'],
    });

    if (!request) {
      throw new NotFoundException(`Leave request with ID "${id}" not found for this tenant.`);
    }
    if (request.status !== 'Pending') {
        throw new BadRequestException(`Leave request is already ${request.status}. Cannot change status.`);
    }

    if (newStatus === 'Approved') {
      const requestedDays = this.calculateDays(request.startDate, request.endDate);
      const leaveType = request.type as string;

      const employee = request.employee;
      const currentBalance = this.getLeaveBalance(employee, leaveType);

      if (currentBalance < requestedDays) {
        throw new BadRequestException(`Insufficient ${request.type} leave days for approval. Employee: ${employee.firstName} ${employee.lastName}. Available: ${currentBalance}, Requested: ${requestedDays}.`);
      }
      
      this.setLeaveBalance(employee, leaveType, currentBalance - requestedDays);
      
      await this.employeeService.update(employee.id, {
          vacationBalance: employee.vacationBalance,
          sickBalance: employee.sickBalance,
          personalBalance: employee.personalBalance,
      }, tenantId); 
    }

    request.status = newStatus;
    return this.leaveRequestsRepository.save(request);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const result = await this.leaveRequestsRepository.delete({ id, tenantId });
    if (result.affected === 0) {
      throw new NotFoundException(`Leave request with ID "${id}" not found for this tenant.`);
    }
  }
}