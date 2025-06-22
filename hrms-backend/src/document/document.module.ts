import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { Document } from './document.entity'; // Import the Document entity
import { EmployeeModule } from '../employee/employee.module'; // Import EmployeeModule (for EmployeeService dependency)

@Module({
  imports: [
    TypeOrmModule.forFeature([Document]), // Register Document entity with TypeORM for this module
    EmployeeModule, // Import EmployeeModule to provide EmployeeService
  ],
  providers: [DocumentService],
  controllers: [DocumentController],
  exports: [DocumentService], // Export DocumentService if other modules might need it
})
export class DocumentModule {}