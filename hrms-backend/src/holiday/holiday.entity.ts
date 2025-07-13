// hrms-backend/src/holiday/holiday.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Tenant } from '../tenant/tenant.entity';

@Entity('holidays') // Table name for public holidays
export class Holiday {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string; // For multi-tenant filtering

  @ManyToOne(() => Tenant, tenant => tenant.holidays, { onDelete: 'CASCADE' }) // Assuming Tenant will have a holidays property
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  name: string; // Name of the holiday (e.g., "Aid Al-Fitr", "Green March Day")

  @Column({ type: 'date' })
  date: Date; // Date of the holiday

  @Column({ default: true })
  isPublic: boolean; // Whether it's a widely recognized public holiday

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}