// hrms-backend/src/employee/employee.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UserService } from '../user/user.service';
import { LeavePolicyService } from '../leave-policy/leave-policy.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee)
    private employeesRepository: Repository<Employee>,
    private userService: UserService,
    private emailService: EmailService,
    private leavePolicyService: LeavePolicyService,
  ) {}

  private async generateTempPassword(): Promise<string> {
    return Math.random().toString(36).slice(-8);
  }

  async create(createEmployeeDto: CreateEmployeeDto, tenantId: string): Promise<Employee> {
    console.log(`--- [EmployeeService] Attempting to create employee for tenantId: ${tenantId}`);
    console.log(`--- [EmployeeService] DTO received:`, createEmployeeDto);

    const existingEmployee = await this.employeesRepository.findOne({
      where: { email: createEmployeeDto.email, tenantId: tenantId },
    });
    if (existingEmployee) {
      throw new BadRequestException('Employee with this email already exists in this tenant.');
    }

    let defaultPolicy: any = null;
    let initialLeaveBalances = {};

    const allPolicies = await this.leavePolicyService.findAll(tenantId);
    if (allPolicies.length > 0) {
      defaultPolicy = allPolicies.find(p => p.name === 'Annual Leave') || allPolicies[0];
      initialLeaveBalances[defaultPolicy.name] = defaultPolicy.accrualRate || 0;
    } else {
        const defaultAnnualLeavePolicy = {
            name: 'Annual Leave',
            description: 'Default annual leave policy (15 days/year)',
            accrualRate: 15,
            accrualUnit: 'year',
            isPaid: true,
            applicableRoles: []
        };
        defaultPolicy = await this.leavePolicyService.create(defaultAnnualLeavePolicy, tenantId);
        initialLeaveBalances[defaultPolicy.name] = defaultPolicy.accrualRate;
        console.warn(`[EmployeeService] No leave policies found, created a default "Annual Leave" policy and assigned to employee.`);
    }

    // FIX: Convert hireDate from string to Date object
    const newEmployeeData: Partial<Employee> = {
      ...createEmployeeDto,
      tenantId,
      hireDate: new Date(createEmployeeDto.hireDate), // Convert hireDate to Date
      leavePolicy: defaultPolicy,
      leavePolicyId: defaultPolicy?.id,
      leaveBalances: initialLeaveBalances,
    };

    const newEmployeeInstance = this.employeesRepository.create(newEmployeeData);
    const savedEmployee: Employee = await this.employeesRepository.save(newEmployeeInstance);
    console.log(`--- [EmployeeService] Employee saved with ID: ${savedEmployee.id}`);

    let linkedUser = await this.userService.findByEmail(savedEmployee.email);

    if (linkedUser && linkedUser.tenantId === tenantId) {
      console.log(`--- [EmployeeService] Found matching user (ID: ${linkedUser.id}). Linking employee.`);
      linkedUser.employeeId = savedEmployee.id;
      await this.userService.save(linkedUser);
      savedEmployee.user = linkedUser;
    } else if (!linkedUser) {
      console.log(`--- [EmployeeService] No user found for employee email. Creating new user account.`);
      const tempPassword = await this.generateTempPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, await bcrypt.genSalt());

      linkedUser = await this.userService.create({
        email: savedEmployee.email,
        password: hashedPassword,
        tenantId: tenantId,
        role: 'employee',
        employeeId: savedEmployee.id,
        isEmailVerified: false,
      });
      savedEmployee.user = linkedUser;

      await this.emailService.sendEmployeeWelcomeEmail(
        savedEmployee.email,
        savedEmployee.firstName,
        tempPassword,
        process.env.FRONTEND_URL
      );
    } else {
        console.warn(`User with email ${savedEmployee.email} already exists in a different tenant. Not linking.`);
    }

    return savedEmployee;
  }

  async findOne(id: string, tenantId: string): Promise<Employee> {
    console.log(`--- [EmployeeService] Attempting to find employee with ID: ${id} for tenantId: ${tenantId}`);
    const employee = await this.employeesRepository.findOne({
      where: { id: id, tenantId: tenantId },
      relations: ['user', 'leavePolicy'],
    });
    if (!employee) {
      console.error(`--- [EmployeeService] FindOne FAILED. No employee found for ID: ${id} and tenantId: ${tenantId}`);
      throw new NotFoundException(`Employee with ID "${id}" not found for this tenant.`);
    }
    console.log(`--- [EmployeeService] FindOne SUCCESS. Found employee:`, employee);
    return employee;
  }

  async findAll(tenantId: string): Promise<Employee[]> {
    return this.employeesRepository.find({
      where: { tenantId: tenantId },
      order: { lastName: 'ASC', firstName: 'ASC' },
      relations: ['user', 'leavePolicy'],
    });
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto, tenantId: string): Promise<Employee> {
    const employee = await this.findOne(id, tenantId);

    if (updateEmployeeDto.leaveBalances) {
      employee.leaveBalances = { ...employee.leaveBalances, ...updateEmployeeDto.leaveBalances };
    }
    if (updateEmployeeDto.leavePolicyId) {
        const policy = await this.leavePolicyService.findOne(updateEmployeeDto.leavePolicyId, tenantId);
        employee.leavePolicy = policy;
        employee.leavePolicyId = policy.id;
    } else if (updateEmployeeDto.leavePolicyId === null) {
        employee.leavePolicy = null;
        employee.leavePolicyId = null;
    }

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