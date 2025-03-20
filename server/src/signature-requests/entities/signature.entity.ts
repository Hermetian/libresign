import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SignatureRequest } from './signature-request.entity';
import { User } from '../../users/entities/user.entity';

@Entity('signatures')
export class Signature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  signatureRequestId: string;

  @ManyToOne(() => SignatureRequest, request => request.signatures)
  @JoinColumn({ name: 'signatureRequestId' })
  signatureRequest: SignatureRequest;

  @Column({ type: 'uuid' })
  signerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'signerId' })
  signer: User;

  @Column({ type: 'text' })
  signatureData: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  signatureHash: string;

  @Column({ type: 'varchar', length: 50 })
  signatureType: string;

  @Column({ type: 'varchar', length: 45 })
  ipAddress: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}