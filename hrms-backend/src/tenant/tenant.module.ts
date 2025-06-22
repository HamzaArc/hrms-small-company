import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './tenant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant])], // Register the Tenant entity with TypeORM
  providers: [], // No specific services/controllers needed in this module for now, as it's mainly for exporting the entity
  controllers: [],
  exports: [TypeOrmModule], // IMPORTANT: Export TypeOrmModule so other modules (like EmployeeModule) can access the Tenant entity's repository if needed via @InjectRepository(Tenant)
})
export class TenantModule {}