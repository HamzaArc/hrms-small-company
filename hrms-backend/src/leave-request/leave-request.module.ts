// hrms-backend/src/leave-request/leave-request.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveRequestService } from './leave-request.service';
import { LeaveRequestController } from './leave-request.controller';
import { LeaveRequest } from './leave-request.entity'; // Import the LeaveRequest entity
import { EmployeeModule } from '../employee/employee.module'; // Import EmployeeModule
import { HolidayModule } from '../holiday/holiday.module'; // NEW: Import HolidayModule

@Module({
  imports: [
    TypeOrmModule.forFeature([LeaveRequest]), // Register LeaveRequest entity with TypeORM for this module
    EmployeeModule, // Import EmployeeModule to provide EmployeeService
    HolidayModule, // NEW: Import HolidayModule to provide HolidayService
  ],
  providers: [LeaveRequestService],
  controllers: [LeaveRequestController],
  exports: [LeaveRequestService], // Export LeaveRequestService if other modules might need it
})
export class LeaveRequestModule {}