import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Employee } from '../employee/employee.entity';
import { Tenant } from '../tenant/tenant.entity';

@Entity('onboarding_tasks') // Table name for onboarding tasks
export class OnboardingTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string; // For multi-tenant filtering

  @ManyToOne(() => Tenant, tenant => tenant.onboardingTasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  employeeId: string; // Foreign key to the Employee table

  @ManyToOne(() => Employee, employee => employee.onboardingTasks, { onDelete: 'CASCADE' }) // Many tasks belong to one employee
  @JoinColumn({ name: 'employeeId' }) // Specifies that 'employeeId' column is the foreign key
  employee: Employee;

  @Column()
  task: string;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({ default: false }) // Whether the task is completed
  completed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}