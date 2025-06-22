import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Employee } from '../employee/employee.entity';
import { Tenant } from '../tenant/tenant.entity';

@Entity('recognitions') // Table name for employee recognitions
export class Recognition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string; // For multi-tenant filtering

  @ManyToOne(() => Tenant, tenant => tenant.recognitions, { onDelete: 'CASCADE' }) // Assuming Tenant will have a recognitions property
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  recipientId: string; // Foreign key to the Employee receiving recognition

  @ManyToOne(() => Employee, employee => employee.recognitions) // Assuming Employee will have a recognitions property
  @JoinColumn({ name: 'recipientId' }) // Link to employee's ID
  recipient: Employee; // The employee object associated with this recognition

  @Column()
  category: string; // e.g., 'teamwork', 'innovation', 'leadership'

  @Column()
  value: string; // e.g., 'integrity', 'excellence', 'collaboration'

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'date' })
  date: Date; // Date when the recognition was given

  @Column()
  givenBy: string; // Name of the person giving the recognition (e.g., 'Current User')

  @Column({ default: true })
  isPublic: boolean; // Whether it's visible to all employees

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}