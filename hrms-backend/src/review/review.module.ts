import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { Review } from './review.entity'; // Import the Review entity
import { EmployeeModule } from '../employee/employee.module'; // Import EmployeeModule
import { GoalModule } from '../goal/goal.module'; // Import GoalModule

@Module({
  imports: [
    TypeOrmModule.forFeature([Review]), // Register Review entity with TypeORM for this module
    EmployeeModule, // Import EmployeeModule to provide EmployeeService
    GoalModule, // Import GoalModule to provide GoalService
  ],
  providers: [ReviewService],
  controllers: [ReviewController],
  exports: [ReviewService], // Export ReviewService if other modules might need it
})
export class ReviewModule {}