import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport'; // For authentication strategies
import { JwtModule } from '@nestjs/jwt'; // For JWT token handling
import { TypeOrmModule } from '@nestjs/typeorm'; // For User entity repository
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../user/user.entity'; // Import User entity
import { EmployeeModule } from '../employee/employee.module'; // Import EmployeeModule for user creation logic (linking to employee)
import { TenantModule } from '../tenant/tenant.module'; // Import TenantModule for user creation logic (linking to tenant)

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // Register User entity with TypeORM for this module
    PassportModule, // Initialize Passport
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'supersecretkey', // <--- IMPORTANT: Use a strong, unique secret from .env
      signOptions: { expiresIn: '1h' }, // Token expiration time
    }),
    EmployeeModule, // Provide EmployeeService if needed for user registration (e.g., linking user to employee)
    TenantModule, // Provide TenantModule for user registration (e.g., linking user to tenant)
  ],
  providers: [AuthService], // Provide AuthService
  controllers: [AuthController],
  exports: [AuthService, JwtModule], // Export AuthService and JwtModule for use in other modules (e.g., Guards)
})
export class AuthModule {}