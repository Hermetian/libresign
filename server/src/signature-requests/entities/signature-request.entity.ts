import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Document } from '../../documents/entities/document.entity';
import { Signature } from './signature.entity';

export enum SignatureRequestStatus {
  PENDING = 'pending',
  SIGNED = 'signed',
  DECLINED = 'declined',
  EXPIRED = 'expired',
}

@Entity('signature_requests')
export class SignatureRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Document, document => document.signatureRequests)
  @JoinColumn({ name: 'documentId' })
  document: Document;

  @Column()
  documentId: string;

  @ManyToOne(() => User, user => user.signatureRequests)
  @JoinColumn({ name: 'requesterId' })
  requester: User;

  @Column()
  requesterId: string;

  @ManyToOne(() => User, user => user.signingRequests, { nullable: true })
  @JoinColumn({ name: 'signerId' })
  signer: User;

  @Column({ nullable: true })
  signerId: string;

  @Column()
  signerEmail: string;

  @Column({ nullable: true })
  message: string;

  @Column({
    type: 'enum',
    enum: SignatureRequestStatus,
    default: SignatureRequestStatus.PENDING
  })
  status: SignatureRequestStatus;

  @Column({ nullable: true })
  signedAt: Date;

  @Column({ nullable: true })
  expiresAt: Date;

  @OneToMany(() => Signature, signature => signature.signatureRequest)
  signatures: Signature[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 