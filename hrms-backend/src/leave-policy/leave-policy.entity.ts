// hrms-backend/src/leave-policy/leave-policy.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Tenant } from '../tenant/tenant.entity';
import { Employee } from '../employee/employee.entity'; // To link employees to policies

@Entity('leave_policies')
export class LeavePolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant, tenant => tenant.leavePolicies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ unique: false }) // Not unique across tenants
  name: string; // e.g., "Annual Leave", "Sick Leave", "Maternity Leave"

  @Column()
  description: string; // Description of the policy

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  accrualRate: number; // Days accrued per unit (e.g., 1.5 days/month)

  @Column({ default: 'month' }) // 'month', 'year', 'once'
  accrualUnit: string; 

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  maxAccumulation: number; // Maximum days that can be accumulated

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  maxPerRequest: number; // Maximum days allowed per single request

  @Column({ default: true })
  isPaid: boolean; // Whether this leave type is paid

  @Column('simple-array', { nullable: true }) // Roles applicable to this policy (e.g., "Employee", "Manager")
  applicableRoles: string[];

  // Future fields: carry over rules, probation period rules, document requirements

  @OneToMany(() => Employee, employee => employee.leavePolicy) // Each employee has one primary leave policy
  employees: Employee[]; // Employees assigned to this policy

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}