// hrms-backend/src/leave-request/leave-request.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { LeaveRequest } from './leave-request.entity';
import { EmployeeService } from '../employee/employee.service';
import { Employee } from '../employee/employee.entity';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { HolidayService } from '../holiday/holiday.service';

@Injectable()
export class LeaveRequestService {
  constructor(
    @InjectRepository(LeaveRequest)
    private leaveRequestsRepository: Repository<LeaveRequest>,
    private employeeService: EmployeeService,
    private holidayService: HolidayService,
  ) {}

  private normalizeDate(date: Date): Date {
    const newDate = new Date(date);
    newDate.setUTCHours(0, 0, 0, 0); // Use UTC to avoid timezone issues
    return newDate;
  }

  private async calculateWorkingDays(startDate: Date, endDate: Date, tenantId: string): Promise<number> {
    const start = this.normalizeDate(startDate);
    const end = this.normalizeDate(endDate);

    console.log(`[LeaveCalc] Calculating working days from ${start.toISOString()} to ${end.toISOString()}`);
    
    const publicHolidays = await this.holidayService.findAll(tenantId, start, end);
    const holidayDates = new Set(publicHolidays.map(h => this.normalizeDate(h.date).getTime()));
    console.log(`[LeaveCalc] Fetched public holidays (${publicHolidays.length}):`, publicHolidays.map(h => h.date));
    console.log(`[LeaveCalc] Normalized holiday timestamps:`, Array.from(holidayDates));

    let workingDays = 0;
    let currentDate = new Date(start);

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const currentDayTimestamp = currentDate.getTime();

      console.log(`[LeaveCalc] Checking date: ${currentDate.toISOString().split('T')[0]} (DayOfWeek: ${dayOfWeek})`);

      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude Saturday (6) and Sunday (0)
        console.log(`[LeaveCalc]   - Not a weekend.`);
        if (!holidayDates.has(currentDayTimestamp)) {
          workingDays++;
          console.log(`[LeaveCalc]   - Not a holiday. Incrementing workingDays. Current: ${workingDays}`);
        } else {
          console.log(`[LeaveCalc]   - Is a holiday. Skipping.`);
        }
      } else {
        console.log(`[LeaveCalc]   - Is a weekend. Skipping.`);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    console.log(`[LeaveCalc] Final calculated working days: ${workingDays}`);
    return workingDays;
  }

  public async getWorkingDaysBetweenDates(startDate: Date, endDate: Date, tenantId: string): Promise<number> {
    return this.calculateWorkingDays(startDate, endDate, tenantId);
  }

  // MODIFIED: Use employee.leaveBalances (JSONB)
  private getLeaveBalance(employee: Employee, leaveTypeName: string): number {
    return employee.leaveBalances[leaveTypeName] || 0; // Access by dynamic type name
  }

  // MODIFIED: Set employee.leaveBalances (JSONB)
  private setLeaveBalance(employee: Employee, leaveTypeName: string, newBalance: number): void {
    employee.leaveBalances[leaveTypeName] = newBalance; // Update dynamic type balance
  }

  async create(createLeaveRequestDto: CreateLeaveRequestDto, tenantId: string): Promise<LeaveRequest> {
    const { employeeId, type, startDate: startDateString, endDate: endDateString, reason } = createLeaveRequestDto;

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
    
    const employee = await this.employeeService.findOne(employeeId, tenantId); // Loads employee with leavePolicy
    if (!employee.leavePolicy) {
        throw new BadRequestException('Employee is not assigned a leave policy.');
    }

    // Validate leave type against assigned policy's name
    if (employee.leavePolicy.name !== type) {
        throw new BadRequestException(`Leave type "${type}" is not allowed for employee's assigned policy: "${employee.leavePolicy.name}".`);
    }

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

    const requestedWorkingDays = await this.getWorkingDaysBetweenDates(startDate, endDate, tenantId);
    if (requestedWorkingDays <= 0) {
        throw new BadRequestException('Leave request must be for at least one working day.');
    }

    const currentBalance = this.getLeaveBalance(employee, type); // Use type from form as leave policy name

    if (currentBalance < requestedWorkingDays) {
        throw new BadRequestException(`Insufficient ${type} leave days available. Available: ${currentBalance}, Requested: ${requestedWorkingDays}.`);
    }

    // Check against maxPerRequest if defined in policy
    if (employee.leavePolicy.maxPerRequest && requestedWorkingDays > employee.leavePolicy.maxPerRequest) {
        throw new BadRequestException(`Requested leave (${requestedWorkingDays} days) exceeds maximum allowed per request (${employee.leavePolicy.maxPerRequest} days) for ${type} leave.`);
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

    // NEW: Load employee with its leavePolicy to get leave type names
    return this.leaveRequestsRepository.find({
      where: whereClause,
      relations: ['employee', 'employee.leavePolicy'], // Load employee.leavePolicy
      order: { requestedDate: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<LeaveRequest> {
    // NEW: Load employee with its leavePolicy to get leave type names
    const request = await this.leaveRequestsRepository.findOne({
      where: { id, tenantId },
      relations: ['employee', 'employee.leavePolicy'], // Load employee.leavePolicy
    });
    if (!request) {
      throw new NotFoundException(`Leave request with ID "${id}" not found for this tenant.`);
    }
    return request;
  }

  async updateStatus(id: string, tenantId: string, newStatus: 'Approved' | 'Rejected'): Promise<LeaveRequest> {
    // NEW: Load employee with its leavePolicy
    const request = await this.leaveRequestsRepository.findOne({
      where: { id, tenantId },
      relations: ['employee', 'employee.leavePolicy'], // Load employee.leavePolicy
    });

    if (!request) {
      throw new NotFoundException(`Leave request with ID "${id}" not found for this tenant.`);
    }
    if (request.status !== 'Pending') {
        throw new BadRequestException(`Leave request is already ${request.status}. Cannot change status.`);
    }
    if (!request.employee.leavePolicy) {
        throw new BadRequestException('Employee is not assigned a leave policy. Cannot process leave approval.');
    }

    if (newStatus === 'Approved') {
      const requestedWorkingDays = await this.getWorkingDaysBetweenDates(request.startDate, request.endDate, tenantId);
      const leaveType = request.type; // Use type from request, which must match policy name

      const employee = request.employee;
      const currentBalance = this.getLeaveBalance(employee, leaveType);

      if (currentBalance < requestedWorkingDays) {
        throw new BadRequestException(`Insufficient ${leaveType} leave days for approval. Employee: ${employee.firstName} ${employee.lastName}. Available: ${currentBalance}, Requested: ${requestedWorkingDays}.`);
      }

      this.setLeaveBalance(employee, leaveType, currentBalance - requestedWorkingDays);

      await this.employeeService.update(employee.id, {
          leaveBalances: employee.leaveBalances, // Pass the updated JSONB object
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