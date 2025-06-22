import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Tenant } from '../tenant/tenant.entity';
import { Employee } from '../employee/employee.entity'; // Optional: link to an employee record

@Entity('users') // Table name for application users
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string; // For multi-tenant filtering

  @ManyToOne(() => Tenant, tenant => tenant.users, { onDelete: 'CASCADE' }) // Assuming Tenant will have a users property
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ nullable: true, unique: true }) // Optional link to employee record, unique per employee
  employeeId: string;

  @OneToOne(() => Employee, employee => employee.user, { onDelete: 'SET NULL' }) // One-to-one with Employee
  @JoinColumn({ name: 'employeeId' }) // Uses employeeId as foreign key
  employee: Employee;

  @Column({ unique: true }) // Email for login, unique across all users
  email: string;

  @Column() // Hashed password
  password: string;

  @Column({ default: 'employee' }) // Role: 'admin', 'hr', 'employee'
  role: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}