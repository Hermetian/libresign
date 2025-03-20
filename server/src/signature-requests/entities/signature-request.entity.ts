import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany
} from 'typeorm';
import { Document } from '../../documents/entities/document.entity';
import { User } from '../../users/entities/user.entity';
import { Signature } from './signature.entity';

export enum SignatureRequestStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  DECLINED = 'declined',
  EXPIRED = 'expired',
}

@Entity('signature_requests')
export class SignatureRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  documentId: string;

  @ManyToOne(() => Document, document => document.signatureRequests)
  @JoinColumn({ name: 'documentId' })
  document: Document;

  @Column({ type: 'uuid' })
  requesterId: string;

  @ManyToOne(() => User, user => user.signatureRequests)
  @JoinColumn({ name: 'requesterId' })
  requester: User;

  @Column({ type: 'uuid', nullable: true })
  signerId: string;

  @ManyToOne(() => User, user => user.signingRequests, { nullable: true })
  @JoinColumn({ name: 'signerId' })
  signer: User;

  @Column({ type: 'varchar', length: 255 })
  signerEmail: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  message: string;

  @Column({
    type: 'enum',
    enum: SignatureRequestStatus,
    default: SignatureRequestStatus.PENDING,
  })
  status: SignatureRequestStatus;

  @Column({ type: 'timestamp', nullable: true })
  signedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Signature, signature => signature.signatureRequest)
  signatures: Signature[];
}