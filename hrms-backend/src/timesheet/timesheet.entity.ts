import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Employee } from '../employee/employee.entity';
import { Tenant } from '../tenant/tenant.entity';

@Entity('timesheets') // Table name for timesheet entries
export class Timesheet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string; // For multi-tenant filtering

  @ManyToOne(() => Tenant, tenant => tenant.timesheets, { onDelete: 'CASCADE' }) // Assuming Tenant will have a timesheets property
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  employeeId: string; // Foreign key to the Employee table

  @ManyToOne(() => Employee, employee => employee.timesheets) // Assuming Employee will have a timesheets property
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'numeric', precision: 4, scale: 2 }) // e.g., 8.00 or 7.50
  hours: number;

  @Column()
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}