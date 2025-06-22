import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Tenant } from '../tenant/tenant.entity';

@Entity('announcements') // Table name for announcements
export class Announcement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string; // For multi-tenant filtering

  @ManyToOne(() => Tenant, tenant => tenant.announcements, { onDelete: 'CASCADE' }) // Assuming Tenant will have an announcements property
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column()
  category: string; // e.g., 'general', 'policy', 'event'

  @Column({ default: 'normal' })
  priority: string; // e.g., 'low', 'normal', 'high', 'urgent'

  @Column({ default: 'all' })
  audience: string; // e.g., 'all', 'department', 'management'

  @Column({ type: 'date' })
  publishDate: Date;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date;

  @Column()
  author: string; // e.g., 'HR Team', 'Management'

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}