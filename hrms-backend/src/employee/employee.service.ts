import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './employee.entity';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee)
    private employeesRepository: Repository<Employee>,
  ) {}

  // CREATE Employee
  async create(employeeData: Partial<Employee>, tenantId: string): Promise<Employee> {
    // Enforce uniqueness of email per tenant
    const existingEmployee = await this.employeesRepository.findOne({
      where: { email: employeeData.email, tenantId: tenantId },
    });
    if (existingEmployee) {
      throw new BadRequestException('Employee with this email already exists in this tenant.');
    }

    const newEmployee = this.employeesRepository.create({ ...employeeData, tenantId });
    return this.employeesRepository.save(newEmployee);
  }

  // READ All Employees for a Tenant
  async findAll(tenantId: string): Promise<Employee[]> {
    return this.employeesRepository.find({
      where: { tenantId: tenantId },
      order: { lastName: 'ASC', firstName: 'ASC' },
    });
  }

  // READ One Employee by ID for a Tenant
  async findOne(id: string, tenantId: string): Promise<Employee> {
    const employee = await this.employeesRepository.findOne({
      where: { id: id, tenantId: tenantId },
    });
    if (!employee) {
      throw new NotFoundException(`Employee with ID "${id}" not found for this tenant.`);
    }
    return employee;
  }

  // UPDATE Employee
  async update(id: string, employeeData: Partial<Employee>, tenantId: string): Promise<Employee> {
    const employee = await this.employeesRepository.findOne({
      where: { id: id, tenantId: tenantId },
    });
    if (!employee) {
      throw new NotFoundException(`Employee with ID "${id}" not found for this tenant.`);
    }

    // Check for email uniqueness if email is being updated
    if (employeeData.email && employeeData.email !== employee.email) {
        const existingEmployee = await this.employeesRepository.findOne({
            where: { email: employeeData.email, tenantId: tenantId },
        });
        if (existingEmployee && existingEmployee.id !== id) {
            throw new BadRequestException('Another employee with this email already exists in this tenant.');
        }
    }

    this.employeesRepository.merge(employee, employeeData);
    return this.employeesRepository.save(employee);
  }

  // DELETE Employee
  async remove(id: string, tenantId: string): Promise<void> {
    const result = await this.employeesRepository.delete({ id: id, tenantId: tenantId });
    if (result.affected === 0) {
      throw new NotFoundException(`Employee with ID "${id}" not found for this tenant.`);
    }
  }
}