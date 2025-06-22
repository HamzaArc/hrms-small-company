import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { EmployeeService } from '../employee/employee.service';
import { Tenant } from '../tenant/tenant.entity';
import { Employee } from '../employee/employee.entity'; // Import Employee entity for type hinting

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Tenant) // Inject Tenant Repository directly from AuthModule to create default tenant
    private tenantsRepository: Repository<Tenant>,
    private jwtService: JwtService,
    private employeeService: EmployeeService, // For linking users to employees
  ) {}

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }

  private async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // --- Tenant Onboarding (Initial Setup) ---
  async createInitialTenantAndAdmin(tenantName: string, adminEmail: string, adminPassword: string): Promise<{ tenant: Tenant, user: User, accessToken: string }> {
    const existingTenant = await this.tenantsRepository.findOne({ where: { name: tenantName } });
    if (existingTenant) {
      throw new BadRequestException('Tenant with this name already exists.');
    }

    const newTenant = this.tenantsRepository.create({ name: tenantName, contactEmail: adminEmail, status: 'active' });
    const tenant = await this.tenantsRepository.save(newTenant);

    const existingUser = await this.usersRepository.findOne({ where: { email: adminEmail, tenantId: tenant.id } });
    if (existingUser) {
      throw new BadRequestException('Admin user with this email already exists for this tenant.');
    }

    const hashedPassword = await this.hashPassword(adminPassword);
    const newUser = this.usersRepository.create({
      email: adminEmail,
      password: hashedPassword,
      tenantId: tenant.id,
      role: 'admin',
    });
    const user = await this.usersRepository.save(newUser);

    const accessToken = this.jwtService.sign({ id: user.id, email: user.email, tenantId: user.tenantId, role: user.role });

    return { tenant, user, accessToken };
  }


  // --- User Registration (for existing tenants) ---
  async register(userData: Partial<User>, tenantId: string): Promise<User> {
    const { email, password, role, employeeId } = userData;

    const tenant = await this.tenantsRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
        throw new NotFoundException(`Tenant with ID "${tenantId}" not found.`);
    }

    const existingUser = await this.usersRepository.findOne({ where: { email, tenantId } });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists for this tenant.');
    }

    const hashedPassword = await this.hashPassword(password as string);

    // FIX: Explicitly type employee variable
    let employee: Employee | null = null; 
    if (employeeId) {
        employee = await this.employeeService.findOne(employeeId as string, tenantId);
        // Check if this employee already has a linked user
        if (employee && employee.user) { // FIX: Check if employee is not null before accessing .user
            throw new BadRequestException(`Employee with ID "${employeeId}" already has a linked user account.`);
        }
    }

    const newUser = this.usersRepository.create({
      email: email as string,
      password: hashedPassword,
      tenantId: tenantId,
      role: role || 'employee',
      employeeId: employeeId,
    });

    const user = await this.usersRepository.save(newUser);

    // If employeeId was provided, link the user back to the employee
    if (employee && !employee.user) { // FIX: Check if employee is not null before accessing .user
        employee.user = user;
        // FIX: Pass a partial update to employeeService.update
        await this.employeeService.update(employee.id, { user: user, tenantId: employee.tenantId } as Partial<Employee>, tenantId); 
    }

    // FIX: Remove password safely by creating a new object or casting
    const userWithoutPassword: Partial<User> = { ...user }; // Create a copy
    delete userWithoutPassword.password; // Delete from the copy

    return userWithoutPassword as User; // Return the copy, asserted back to User type
  }

  // --- User Login ---
  async login(email: string, password: string, tenantId: string): Promise<{ accessToken: string, user: Partial<User> }> {
    const user = await this.usersRepository.findOne({ where: { email, tenantId } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isMatch = await this.validatePassword(password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const payload = { id: user.id, email: user.email, tenantId: user.tenantId, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    const userWithoutPassword: Partial<User> = { ...user }; // Create a copy
    delete userWithoutPassword.password; // Delete from the copy

    return { accessToken, user: userWithoutPassword };
  }
}