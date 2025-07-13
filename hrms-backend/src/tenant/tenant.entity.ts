// hrms-backend/src/tenant/tenant.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Employee } from '../employee/employee.entity';
import { OnboardingTask } from '../onboarding-task/onboarding-task.entity';
import { Document } from '../document/document.entity';
import { LeaveRequest } from '../leave-request/leave-request.entity';
import { Timesheet } from '../timesheet/timesheet.entity';
import { Goal } from '../goal/goal.entity';
import { Review } from '../review/review.entity';
import { Announcement } from '../announcement/announcement.entity';
import { Recognition } from '../recognition/recognition.entity';
import { User } from '../user/user.entity';
import { Holiday } from '../holiday/holiday.entity';
import { LeavePolicy } from '../leave-policy/leave-policy.entity'; // NEW: Import LeavePolicy entity

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ nullable: true })
  contactEmail: string;

  @OneToMany(() => Employee, employee => employee.tenant)
  employees: Employee[];

  @OneToMany(() => OnboardingTask, onboardingTask => onboardingTask.tenant)
  onboardingTasks: OnboardingTask[];

  @OneToMany(() => Document, document => document.tenant)
  documents: Document[];

  @OneToMany(() => LeaveRequest, leaveRequest => leaveRequest.tenant)
  leaveRequests: LeaveRequest[];

  @OneToMany(() => Timesheet, timesheet => timesheet.tenant)
  timesheets: Timesheet[];

  @OneToMany(() => Goal, goal => goal.tenant)
  goals: Goal[];

  @OneToMany(() => Review, review => review.tenant)
  reviews: Review[];

  @OneToMany(() => Announcement, announcement => announcement.tenant)
  announcements: Announcement[];

  @OneToMany(() => Recognition, recognition => recognition.tenant)
  recognitions: Recognition[];

  @OneToMany(() => User, user => user.tenant)
  users: User[];

  @OneToMany(() => Holiday, holiday => holiday.tenant)
  holidays: Holiday[];

  @OneToMany(() => LeavePolicy, leavePolicy => leavePolicy.tenant) // NEW: Add this relationship
  leavePolicies: LeavePolicy[]; // NEW: Add this property

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}