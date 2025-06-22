import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveRequestService } from './leave-request.service';
import { LeaveRequestController } from './leave-request.controller';
import { LeaveRequest } from './leave-request.entity'; // Import the LeaveRequest entity
import { EmployeeModule } from '../employee/employee.module'; // Import EmployeeModule

@Module({
  imports: [
    TypeOrmModule.forFeature([LeaveRequest]), // Register LeaveRequest entity with TypeORM for this module
    EmployeeModule, // Import EmployeeModule to provide EmployeeService
  ],
  providers: [LeaveRequestService],
  controllers: [LeaveRequestController],
  exports: [LeaveRequestService], // Export LeaveRequestService if other modules might need it
})
export class LeaveRequestModule {}