import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Employee } from '../employee/employee.entity';
import { Tenant } from '../tenant/tenant.entity';

@Entity('reviews') // Table name for performance reviews
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string; // For multi-tenant filtering

  @ManyToOne(() => Tenant, tenant => tenant.reviews, { onDelete: 'CASCADE' }) // Assuming Tenant will have a reviews property
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  employeeId: string; // Foreign key to the Employee being reviewed

  @ManyToOne(() => Employee, employee => employee.reviews) // Assuming Employee will have a reviews property
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column()
  reviewer: string;

  @Column({ type: 'date' })
  reviewDate: Date; // Date when the review was conducted

  @Column()
  reviewPeriod: string; // e.g., 'Q1-2025', 'Annual-2024'

  @Column({ type: 'numeric', precision: 2, scale: 1 }) // e.g., 4.5
  rating: number; // Overall rating

  @Column({ type: 'jsonb', nullable: true }) // Store detailed ratings as JSONB
  ratings: {
    overall?: number;
    performance?: number;
    communication?: number;
    teamwork?: number;
    innovation?: number;
  };

  @Column({ nullable: true })
  strengths: string;

  @Column({ nullable: true })
  improvements: string;

  @Column()
  comments: string;

  @Column('text', { array: true, nullable: true }) // Array of Goal IDs linked to this review
  linkedGoals: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}