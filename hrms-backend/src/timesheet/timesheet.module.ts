import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimesheetService } from './timesheet.service';
import { TimesheetController } from './timesheet.controller';
import { Timesheet } from './timesheet.entity'; // Import the Timesheet entity
import { EmployeeModule } from '../employee/employee.module'; // Import EmployeeModule

@Module({
  imports: [
    TypeOrmModule.forFeature([Timesheet]), // Register Timesheet entity with TypeORM for this module
    EmployeeModule, // Import EmployeeModule to provide EmployeeService
  ],
  providers: [TimesheetService],
  controllers: [TimesheetController],
  exports: [TimesheetService], // Export TimesheetService if other modules might need it
})
export class TimesheetModule {}