import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SignatureRequest } from '../../signature-requests/entities/signature-request.entity';

export enum DocumentStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  COMPLETED = 'completed',
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  s3Key: string;

  @Column({ nullable: true })
  fileHash: string;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.DRAFT
  })
  status: DocumentStatus;

  @ManyToOne(() => User, user => user.documents)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  ownerId: string;

  @OneToMany(() => SignatureRequest, request => request.document)
  signatureRequests: SignatureRequest[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 