// hrms-backend/src/leave-policy/leave-policy.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeavePolicyService } from './leave-policy.service';
import { LeavePolicyController } from './leave-policy.controller';
import { LeavePolicy } from './leave-policy.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LeavePolicy])],
  providers: [LeavePolicyService],
  controllers: [LeavePolicyController],
  exports: [LeavePolicyService], // Export for use in other modules (e.g., EmployeeService, LeaveRequestService)
})
export class LeavePolicyModule {}