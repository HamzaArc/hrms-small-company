import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnboardingTaskService } from './onboarding-task.service';
import { OnboardingTaskController } from './onboarding-task.controller';
import { OnboardingTask } from './onboarding-task.entity';
import { EmployeeModule } from '../employee/employee.module'; // Import EmployeeModule because OnboardingTaskService uses EmployeeService

@Module({
  imports: [
    TypeOrmModule.forFeature([OnboardingTask]), // Register the OnboardingTask entity with TypeORM
    EmployeeModule, // Import EmployeeModule to make EmployeeService available to OnboardingTaskService
  ],
  providers: [OnboardingTaskService], // Register the OnboardingTaskService
  controllers: [OnboardingTaskController], // Register the OnboardingTaskController
  exports: [OnboardingTaskService], // Export the service if other modules might need to inject it
})
export class OnboardingTaskModule {}