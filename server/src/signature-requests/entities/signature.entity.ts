import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SignatureRequest } from './signature-request.entity';

@Entity('signatures')
export class Signature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SignatureRequest, request => request.signatures)
  @JoinColumn({ name: 'signatureRequestId' })
  signatureRequest: SignatureRequest;

  @Column()
  signatureRequestId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'signerId' })
  signer: User;

  @Column()
  signerId: string;

  @Column({ type: 'text' })
  signatureData: string;

  @Column()
  signatureType: string;

  @Column({ nullable: true })
  positionX: number;

  @Column({ nullable: true })
  positionY: number;

  @Column({ nullable: true })
  page: number;

  @Column()
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
} 