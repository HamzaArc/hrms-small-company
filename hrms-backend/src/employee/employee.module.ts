// hrms-backend/src/employee/employee.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from './employee.entity';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { LeavePolicyModule } from '../leave-policy/leave-policy.module';
import { EmailModule } from '../email/email.module'; // NEW: Import EmailModule

@Module({
  imports: [
    TypeOrmModule.forFeature([Employee]),
    UserModule,
    forwardRef(() => AuthModule),
    LeavePolicyModule,
    EmailModule, // NEW: Add EmailModule here
  ],
  providers: [EmployeeService],
  controllers: [EmployeeController],
  exports: [EmployeeService],
})
export class EmployeeModule {}