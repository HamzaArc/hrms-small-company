import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Employee } from '../employee/employee.entity';
import { Tenant } from '../tenant/tenant.entity';

@Entity('goals') // Table name for goals
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string; // For multi-tenant filtering

  @ManyToOne(() => Tenant, tenant => tenant.goals, { onDelete: 'CASCADE' }) // Assuming Tenant will have a goals property
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  employeeId: string; // Foreign key to the Employee table

  @ManyToOne(() => Employee, employee => employee.goals) // Assuming Employee will have a goals property
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column()
  objective: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column()
  category: string; // e.g., 'Performance', 'Development', 'Project'

  @Column({ default: 'Medium' })
  priority: string; // e.g., 'High', 'Medium', 'Low'

  @Column({ default: 'Not Started' })
  status: string; // e.g., 'Not Started', 'In Progress', 'Completed', 'Overdue'

  @Column('text', { array: true, nullable: true }) // Array of strings for key results
  keyResults: string[];

  @Column({ type: 'date' })
  createdDate: Date; // Date when the goal was initially created

  @CreateDateColumn()
  createdAt: Date; // Automatically generated timestamp

  @UpdateDateColumn()
  updatedAt: Date; // Automatically updated timestamp
}