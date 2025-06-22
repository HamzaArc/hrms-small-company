import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveRequest } from './leave-request.entity';
import { EmployeeService } from '../employee/employee.service';
import { Employee } from '../employee/employee.entity'; // Import Employee for type hinting

@Injectable()
export class LeaveRequestService {
  constructor(
    @InjectRepository(LeaveRequest)
    private leaveRequestsRepository: Repository<LeaveRequest>,
    private employeeService: EmployeeService, // Inject EmployeeService
  ) {}

  // Helper to calculate days between dates (inclusive)
  private calculateDays(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }

  // Helper to get / set leave balance based on type (maps string to property)
  // This now returns number or throws error for invalid type, ensuring type safety.
  private getLeaveBalance(employee: Employee, leaveType: string): number {
    const lowerCaseType = leaveType.toLowerCase();
    switch (lowerCaseType) {
      case 'vacation': return employee.vacationBalance;
      case 'sick': return employee.sickBalance;
      case 'personal': return employee.personalBalance;
      default:
        // This case should ideally be caught by controller validation,
        // but as a fallback, throw an error to prevent 'undefined' assignment.
        throw new BadRequestException(`Invalid leave type provided: ${leaveType}. Must be Vacation, Sick, or Personal.`);
    }
  }

  private setLeaveBalance(employee: Employee, leaveType: string, newBalance: number): void {
    const lowerCaseType = leaveType.toLowerCase();
    switch (lowerCaseType) {
      case 'vacation': employee.vacationBalance = newBalance; break;
      case 'sick': employee.sickBalance = newBalance; break;
      case 'personal': employee.personalBalance = newBalance; break;
      default:
        // This case should not be reached if getLeaveBalance already validates, but included for completeness.
        throw new BadRequestException(`Invalid leave type for setting balance: ${leaveType}.`);
    }
  }

  // CREATE Leave Request
  async create(leaveRequestData: Partial<LeaveRequest>, tenantId: string): Promise<LeaveRequest> {
    // --- FIX: Use non-null assertion (!) because controller ensures these are present ---
    const startDate = new Date(leaveRequestData.startDate!); 
    const endDate = new Date(leaveRequestData.endDate!);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (endDate < startDate) {
        throw new BadRequestException('End date must be on or after start date.');
    }
    if (startDate < today) {
        throw new BadRequestException('Start date cannot be in the past.');
    }

    const requestedDays = this.calculateDays(startDate, endDate);
    if (requestedDays <= 0) {
        throw new BadRequestException('Leave request must be for at least one day.');
    }

    // Assert employeeId and type as strings because controller validation ensures they exist
    const employee = await this.employeeService.findOne(leaveRequestData.employeeId as string, tenantId);
    const leaveType = leaveRequestData.type as string; // Assert as string

    const currentBalance = this.getLeaveBalance(employee, leaveType); // This now throws an error for invalid types

    if (currentBalance < requestedDays) {
        throw new BadRequestException(`Insufficient ${leaveRequestData.type} leave days available. Available: ${currentBalance}, Requested: ${requestedDays}.`);
    }

    const newRequest = this.leaveRequestsRepository.create({
        ...leaveRequestData,
        tenantId,
        requestedDate: new Date(), // Set requestedDate to now
        status: 'Pending', // Default status
    });
    return this.leaveRequestsRepository.save(newRequest);
  }

  // READ All Leave Requests for a Tenant
  async findAll(tenantId: string): Promise<LeaveRequest[]> {
    return this.leaveRequestsRepository.find({
      where: { tenantId },
      relations: ['employee'], // Load employee data along with leave request
      order: { requestedDate: 'DESC' },
    });
  }

  // READ One Leave Request by ID for a Tenant
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

  // UPDATE Leave Request Status (Approve/Reject)
  async updateStatus(id: string, tenantId: string, newStatus: 'Approved' | 'Rejected'): Promise<LeaveRequest> {
    const request = await this.leaveRequestsRepository.findOne({
      where: { id, tenantId },
      relations: ['employee'], // Need employee to update balance
    });

    if (!request) {
      throw new NotFoundException(`Leave request with ID "${id}" not found for this tenant.`);
    }
    if (request.status !== 'Pending') {
        throw new BadRequestException(`Leave request is already ${request.status}. Cannot change status.`);
    }

    if (newStatus === 'Approved') {
      const requestedDays = this.calculateDays(request.startDate, request.endDate);
      const leaveType = request.type as string; // Assert as string

      const employee = request.employee; // Employee is loaded via relations
      const currentBalance = this.getLeaveBalance(employee, leaveType); // This now throws an error for invalid types

      if (currentBalance < requestedDays) {
        throw new BadRequestException(`Insufficient ${request.type} leave days for approval. Employee: ${employee.firstName} ${employee.lastName}. Available: ${currentBalance}, Requested: ${requestedDays}.`);
      }

      // Update the specific balance property on the employee object
      this.setLeaveBalance(employee, leaveType, currentBalance - requestedDays);
      
      // Pass only the relevant updated balance properties to the employeeService.update method
      // The update method expects a Partial<Employee> so this is correct.
      await this.employeeService.update(employee.id, {
          vacationBalance: employee.vacationBalance,
          sickBalance: employee.sickBalance,
          personalBalance: employee.personalBalance,
          tenantId: employee.tenantId // Always include tenantId for tenant-aware updates
      }, tenantId); 
    }

    request.status = newStatus;
    return this.leaveRequestsRepository.save(request);
  }

  // DELETE Leave Request (Optional, only if allowed to delete approved/rejected)
  async remove(id: string, tenantId: string): Promise<void> {
    const result = await this.leaveRequestsRepository.delete({ id, tenantId });
    if (result.affected === 0) {
      throw new NotFoundException(`Leave request with ID "${id}" not found for this tenant.`);
    }
  }
}