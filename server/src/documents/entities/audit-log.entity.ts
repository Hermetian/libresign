import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Document } from './document.entity';

export enum AuditLogAction {
  DOCUMENT_CREATED = 'document_created',
  DOCUMENT_UPDATED = 'document_updated',
  DOCUMENT_DELETED = 'document_deleted',
  SIGNATURE_REQUESTED = 'signature_requested',
  DOCUMENT_SIGNED = 'document_signed',
  SIGNATURE_DECLINED = 'signature_declined',
  DOCUMENT_VIEWED = 'document_viewed',
  DOCUMENT_DOWNLOADED = 'document_downloaded',
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Document)
  @JoinColumn({ name: 'documentId' })
  document: Document;

  @Column()
  documentId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: string;

  @Column({
    type: 'enum',
    enum: AuditLogAction,
  })
  action: AuditLogAction;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, any>;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
} 