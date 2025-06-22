import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Employee } from '../employee/employee.entity';
import { Tenant } from '../tenant/tenant.entity';

@Entity('documents') // Table name for documents
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string; // For multi-tenant filtering

  @ManyToOne(() => Tenant, tenant => tenant.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  employeeId: string; // Foreign key to the Employee table

  @ManyToOne(() => Employee, employee => employee.documents, { onDelete: 'CASCADE' }) // Many documents belong to one employee
  @JoinColumn({ name: 'employeeId' }) // Specifies that 'employeeId' column is the foreign key
  employee: Employee;

  @Column()
  name: string; // Name of the document (e.g., "Employment Contract")

  @Column()
  type: string; // Type of document (e.g., "Contract", "Identification")

  @Column({ type: 'date' })
  uploadDate: Date;

  @Column({ type: 'date', nullable: true }) // Optional expiry date
  expiryDate: Date;

  @Column({ default: 'Active' }) // Status of the document (e.g., 'Active', 'Expired', 'Pending')
  status: string;

  @Column({ nullable: true })
  fileUrl: string; // URL to the actual file in cloud storage (e.g., AWS S3)

  @Column({ type: 'date', nullable: true }) // Date when the document was signed (if applicable)
  signedDate: Date;

  @Column({ nullable: true }) // Additional notes about the document
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}