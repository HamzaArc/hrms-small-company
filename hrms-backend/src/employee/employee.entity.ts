// hrms-backend/src/employee/employee.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToOne } from 'typeorm';
import { Tenant } from '../tenant/tenant.entity';
import { OnboardingTask } from '../onboarding-task/onboarding-task.entity';
import { Document } from '../document/document.entity';
import { LeaveRequest } from '../leave-request/leave-request.entity';
import { Timesheet } from '../timesheet/timesheet.entity';
import { Goal } from '../goal/goal.entity';
import { Review } from '../review/review.entity';
import { Recognition } from '../recognition/recognition.entity';
import { User } from '../user/user.entity';
import { LeavePolicy } from '../leave-policy/leave-policy.entity'; // NEW: Import LeavePolicy entity

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant, tenant => tenant.employees, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column()
  role: string;

  @Column()
  department: string;

  @Column({ type: 'date' })
  hireDate: Date;

  @Column({ default: 'Active' })
  status: string;

  // REMOVED: Fixed leave balances. Will be dynamic based on policies.
  // @Column({ default: 15 })
  // vacationBalance: number;
  // @Column({ default: 10 })
  // sickBalance: number;
  // @Column({ default: 5 })
  // personalBalance: number;

  @Column({ type: 'uuid', nullable: true }) // NEW: Foreign key to LeavePolicy
  leavePolicyId: string;

  @ManyToOne(() => LeavePolicy, leavePolicy => leavePolicy.employees, { onDelete: 'SET NULL', nullable: true }) // NEW: Many-to-one relationship with LeavePolicy
  @JoinColumn({ name: 'leavePolicyId' })
  leavePolicy: LeavePolicy;

  @Column({ type: 'jsonb', nullable: true, default: {} }) // NEW: Dynamic leave balances based on policy types
  leaveBalances: { [key: string]: number }; // e.g., { "Annual Leave": 10, "Sick Leave": 5 }

  @OneToMany(() => OnboardingTask, onboardingTask => onboardingTask.employee)
  onboardingTasks: OnboardingTask[];

  @OneToMany(() => Document, document => document.employee)
  documents: Document[];

  @OneToMany(() => LeaveRequest, leaveRequest => leaveRequest.employee)
  leaveRequests: LeaveRequest[];

  @OneToMany(() => Timesheet, timesheet => timesheet.employee)
  timesheets: Timesheet[];

  @OneToMany(() => Goal, goal => goal.employee)
  goals: Goal[];

  @OneToMany(() => Review, review => review.employee)
  reviews: Review[];

  @OneToMany(() => Recognition, recognition => recognition.recipient)
  recognitions: Recognition[];

  @OneToOne(() => User, user => user.employee, { nullable: true })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}