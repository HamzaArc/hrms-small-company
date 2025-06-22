import { Module } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from './employee.entity';
import { TenantModule } from '../tenant/tenant.module'; // This import will now work!

@Module({
  imports: [
    TypeOrmModule.forFeature([Employee]), // This line registers the Employee entity with TypeORM
    TenantModule, // Import TenantModule
  ],
  providers: [EmployeeService],
  controllers: [EmployeeController],
  exports: [EmployeeService], // Export EmployeeService if other modules need to use it
})
export class EmployeeModule {}