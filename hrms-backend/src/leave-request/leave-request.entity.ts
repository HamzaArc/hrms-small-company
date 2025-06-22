import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Employee } from '../employee/employee.entity';
import { Tenant } from '../tenant/tenant.entity';

@Entity('leave_requests') // Table name for leave requests
export class LeaveRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string; // For multi-tenant filtering

  @ManyToOne(() => Tenant, tenant => tenant.leaveRequests, { onDelete: 'CASCADE' }) // Assuming Tenant will have a leaveRequests property
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  employeeId: string; // Foreign key to the Employee table

  @ManyToOne(() => Employee, employee => employee.leaveRequests) // Assuming Employee will have a leaveRequests property
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column()
  type: string; // e.g., 'Vacation', 'Sick', 'Personal'

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column()
  reason: string;

  @Column({ type: 'date' })
  requestedDate: Date;

  @Column({ default: 'Pending' }) // Status: 'Pending', 'Approved', 'Rejected'
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}