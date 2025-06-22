import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Employee } from '../employee/employee.entity';
import { OnboardingTask } from '../onboarding-task/onboarding-task.entity'; // NEW IMPORT
import { Document } from '../document/document.entity'; // NEW IMPORT
import { LeaveRequest } from '../leave-request/leave-request.entity'; // Add this import
import { Timesheet } from '../timesheet/timesheet.entity'; // Add this import
import { Goal } from '../goal/goal.entity'; // Add this import
import { Review } from '../review/review.entity'; // Add this import
import { Announcement } from '../announcement/announcement.entity'; // Add this import
import { Recognition } from '../recognition/recognition.entity'; // Add this import
import { User } from '../user/user.entity'; // Add this import


@Entity('tenants') // This is the name of the table in your PostgreSQL database
export class Tenant {
  @PrimaryGeneratedColumn('uuid') // Automatically generates a unique identifier (UUID) for each tenant
  id: string;

  @Column({ unique: true }) // Ensures each tenant name is unique
  name: string; // The name of the company (e.g., "Acme Corp")

  @Column({ default: 'active' }) // Current status of the tenant (e.g., 'active', 'inactive')
  status: string;

  @Column({ nullable: true }) // Optional contact email for the tenant
  contactEmail: string;

  @OneToMany(() => Employee, employee => employee.tenant)
  employees: Employee[]; // Defines the one-to-many relationship with employees

  @OneToMany(() => OnboardingTask, onboardingTask => onboardingTask.tenant) // NEW: Define relationship to OnboardingTasks
  onboardingTasks: OnboardingTask[];

  @OneToMany(() => Document, document => document.tenant) // NEW: Define relationship to Documents
  documents: Document[];

  @OneToMany(() => LeaveRequest, leaveRequest => leaveRequest.tenant) // Add this line
  leaveRequests: LeaveRequest[];

  @OneToMany(() => Timesheet, timesheet => timesheet.tenant) // Add this line
  timesheets: Timesheet[];

  @OneToMany(() => Goal, goal => goal.tenant) // Add this line
  goals: Goal[];

  @OneToMany(() => Review, review => review.tenant) // Add this line
  reviews: Review[];

  @OneToMany(() => Announcement, announcement => announcement.tenant) // Add this line
  announcements: Announcement[];

  @OneToMany(() => Recognition, recognition => recognition.tenant) // Add this line
  recognitions: Recognition[];

  @OneToMany(() => User, user => user.tenant) // Add this line
  users: User[];

  @CreateDateColumn() // Automatically sets the creation timestamp
  createdAt: Date;

  @UpdateDateColumn() // Automatically updates the timestamp on each update
  updatedAt: Date;
}