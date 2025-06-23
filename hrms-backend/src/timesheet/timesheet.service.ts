// hrms-backend/src/timesheet/timesheet.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm'; // Import Between
import { Timesheet } from './timesheet.entity';
import { EmployeeService } from '../employee/employee.service'; // To validate employee existence

@Injectable()
export class TimesheetService {
  constructor(
    @InjectRepository(Timesheet)
    private timesheetsRepository: Repository<Timesheet>,
    private employeeService: EmployeeService, // Inject EmployeeService
  ) {}

  // CREATE Timesheet Entry
  async create(timesheetData: Partial<Timesheet>, tenantId: string): Promise<Timesheet> {
    // Validate employee exists for this tenant
    await this.employeeService.findOne(timesheetData.employeeId as string, tenantId);

    // Validate hours
    if (timesheetData.hours === undefined || timesheetData.hours <= 0 || timesheetData.hours > 24) {
      throw new BadRequestException('Hours must be a number between 0.01 and 24.');
    }

    // --- FIX for TS2352 Error on line 26 ---
    // Assert date as non-null because controller validation ensures it exists
    const entryDate = new Date(timesheetData.date!); 
    if (entryDate > new Date()) {
        throw new BadRequestException('Timesheet date cannot be in the future.');
    }

    const newTimesheet = this.timesheetsRepository.create({ ...timesheetData, tenantId });
    return this.timesheetsRepository.save(newTimesheet);
  }

  // READ All Timesheet Entries for a Tenant (with optional employee filter)
  async findAll(tenantId: string, employeeId?: string): Promise<Timesheet[]> {
    const whereClause: any = { tenantId: tenantId };
    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    return this.timesheetsRepository.find({
      where: whereClause,
      relations: ['employee'], // Load employee data
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  // READ One Timesheet Entry by ID for a Tenant
  async findOne(id: string, tenantId: string): Promise<Timesheet> {
    const timesheet = await this.timesheetsRepository.findOne({
      where: { id: id, tenantId: tenantId },
      relations: ['employee'],
    });
    if (!timesheet) {
      throw new NotFoundException(`Timesheet entry with ID "${id}" not found for this tenant.`);
    }
    return timesheet;
  }

  // UPDATE Timesheet Entry
  async update(id: string, timesheetData: Partial<Timesheet>, tenantId: string): Promise<Timesheet> {
    const timesheet = await this.timesheetsRepository.findOne({
      where: { id: id, tenantId: tenantId },
    });
    if (!timesheet) {
      throw new NotFoundException(`Timesheet entry with ID "${id}" not found for this tenant.`);
    }

    if (timesheetData.hours !== undefined) {
        if (timesheetData.hours <= 0 || timesheetData.hours > 24) {
            throw new BadRequestException('Hours must be a number between 0.01 and 24.');
        }
    }
    if (timesheetData.date !== undefined) {
        // --- FIX for TS2352 Error on line 76 ---
        // Assert date as non-null because it's checked for undefined, and then handled as Date.
        const entryDate = new Date(timesheetData.date!); 
        if (entryDate > new Date()) {
            throw new BadRequestException('Timesheet date cannot be in the future.');
        }
    }

    this.timesheetsRepository.merge(timesheet, timesheetData);
    return this.timesheetsRepository.save(timesheet);
  }

  // DELETE Timesheet Entry
  async remove(id: string, tenantId: string): Promise<void> {
    const result = await this.timesheetsRepository.delete({ id: id, tenantId: tenantId });
    if (result.affected === 0) {
      throw new NotFoundException(`Timesheet entry with ID "${id}" not found for this tenant.`);
    }
  }

    async findAllByEmployeeAndDateRange(employeeId: string, startDate: string, endDate: string, tenantId: string): Promise<Timesheet[]> {
    // Optionally validate employee exists if not doing it in controller
    await this.employeeService.findOne(employeeId, tenantId);

    return this.timesheetsRepository.find({
      where: {
        tenantId: tenantId,
        employeeId: employeeId,
        date: Between(new Date(startDate), new Date(endDate)),
      },
      relations: ['employee'],
      order: { date: 'ASC' }, // Order by date for chronological week display
    });
  }
}