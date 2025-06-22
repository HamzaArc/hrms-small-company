import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecognitionService } from './recognition.service';
import { RecognitionController } from './recognition.controller';
import { Recognition } from './recognition.entity'; // Import the Recognition entity
import { EmployeeModule } from '../employee/employee.module'; // Import EmployeeModule (for EmployeeService dependency)

@Module({
  imports: [
    TypeOrmModule.forFeature([Recognition]), // Register Recognition entity with TypeORM for this module
    EmployeeModule, // Import EmployeeModule to provide EmployeeService
  ],
  providers: [RecognitionService],
  controllers: [RecognitionController],
  exports: [RecognitionService], // Export RecognitionService if other modules might need it
})
export class RecognitionModule {}