import { Injectable, BadRequestException, UnauthorizedException, forwardRef, Inject } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { EmployeeService } from '../employee/employee.service';
import { TenantService } from '../tenant/tenant.service';
import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private tenantService: TenantService,
    private jwtService: JwtService,
    @Inject(forwardRef(() => EmployeeService))
    private employeeService: EmployeeService,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }

  async login(email: string, password: string): Promise<{ accessToken: string; user: Partial<User> }> {
    const user = await this.userService.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials.');
    }
    const userWithRelations = await this.userService.findByIdWithTenant(user.id);
    const payload = { 
      id: userWithRelations.id, 
      email: userWithRelations.email, 
      tenantId: userWithRelations.tenantId, 
      role: userWithRelations.role,
      employeeId: userWithRelations.employeeId 
    };
    const accessToken = this.jwtService.sign(payload);
    delete userWithRelations.password;
    return { accessToken, user: userWithRelations };
  }

  async createInitialTenantAndAdmin(tenantName: string, adminEmail: string, adminPassword: string): Promise<{ user: Partial<User>; accessToken: string; }> {
    const existingUser = await this.userService.findByEmail(adminEmail);
    if (existingUser) {
      throw new BadRequestException('This email address is already in use.');
    }
    const tenant = await this.tenantService.create({ name: tenantName, contactEmail: adminEmail, status: 'active' });
    const user = await this.userService.create({
        email: adminEmail,
        password: await this.hashPassword(adminPassword),
        tenantId: tenant.id,
        role: 'admin',
    });
    // Create an employee record for this admin user and link them
    await this.employeeService.create({
        firstName: 'Admin',
        lastName: 'User',
        email: adminEmail,
        role: 'Admin',
        department: 'Management',
        hireDate: new Date().toISOString().split('T')[0],
        status: 'Active'
    }, tenant.id);
    
    const finalLinkedUser = await this.userService.findByIdWithTenant(user.id);
    const payload = { 
        id: finalLinkedUser.id, 
        email: finalLinkedUser.email, 
        tenantId: finalLinkedUser.tenantId, 
        role: finalLinkedUser.role,
        employeeId: finalLinkedUser.employeeId
    };
    const accessToken = this.jwtService.sign(payload);
    delete finalLinkedUser.password;
    return { user: finalLinkedUser, accessToken };
  }
}