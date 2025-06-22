import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee)
    private employeesRepository: Repository<Employee>,
    private userService: UserService,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto, tenantId: string): Promise<Employee> {
    console.log(`--- [EmployeeService] Attempting to create employee for tenantId: ${tenantId}`);
    console.log(`--- [EmployeeService] DTO received:`, createEmployeeDto);

    const existingEmployee = await this.employeesRepository.findOne({
      where: { email: createEmployeeDto.email, tenantId: tenantId },
    });
    if (existingEmployee) {
      throw new BadRequestException('Employee with this email already exists in this tenant.');
    }

    const newEmployee = this.employeesRepository.create({ ...createEmployeeDto, tenantId });
    const savedEmployee = await this.employeesRepository.save(newEmployee);
    console.log(`--- [EmployeeService] Employee saved with ID: ${savedEmployee.id}`);
    
    const existingUser = await this.userService.findByEmail(savedEmployee.email);
    if (existingUser && existingUser.tenantId === tenantId) {
      console.log(`--- [EmployeeService] Found matching user (ID: ${existingUser.id}). Linking employee.`);
      existingUser.employeeId = savedEmployee.id;
      await this.userService.save(existingUser);
      savedEmployee.user = existingUser;
    } else {
      console.log(`--- [EmployeeService] No matching user found to link.`);
    }

    return savedEmployee;
  }

  async findOne(id: string, tenantId: string): Promise<Employee> {
    console.log(`--- [EmployeeService] Attempting to find employee with ID: ${id} for tenantId: ${tenantId}`);
    const employee = await this.employeesRepository.findOne({
      where: { id: id, tenantId: tenantId },
      relations: ['user'],
    });
    if (!employee) {
      console.error(`--- [EmployeeService] FindOne FAILED. No employee found for ID: ${id} and tenantId: ${tenantId}`);
      throw new NotFoundException(`Employee with ID "${id}" not found for this tenant.`);
    }
    console.log(`--- [EmployeeService] FindOne SUCCESS. Found employee:`, employee);
    return employee;
  }

  // ... other methods (findAll, update, remove) remain the same.
  async findAll(tenantId: string): Promise<Employee[]> {
    return this.employeesRepository.find({
      where: { tenantId: tenantId },
      order: { lastName: 'ASC', firstName: 'ASC' },
      relations: ['user'],
    });
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto, tenantId: string): Promise<Employee> {
    const employee = await this.findOne(id, tenantId); // findOne now has logging
    this.employeesRepository.merge(employee, updateEmployeeDto);
    return this.employeesRepository.save(employee);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const result = await this.employeesRepository.delete({ id: id, tenantId: tenantId });
    if (result.affected === 0) {
      throw new NotFoundException(`Employee with ID "${id}" not found for this tenant.`);
    }
  }
}