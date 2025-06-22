import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoalService } from './goal.service';
import { GoalController } from './goal.controller';
import { Goal } from './goal.entity'; // Import the Goal entity
import { EmployeeModule } from '../employee/employee.module'; // Import EmployeeModule

@Module({
  imports: [
    TypeOrmModule.forFeature([Goal]), // Register Goal entity with TypeORM for this module
    EmployeeModule, // Import EmployeeModule to provide EmployeeService
  ],
  providers: [GoalService],
  controllers: [GoalController],
  exports: [GoalService], // Export GoalService if other modules might need it
})
export class GoalModule {}