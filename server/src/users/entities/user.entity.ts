import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Document } from '../../documents/entities/document.entity';
import { SignatureRequest } from '../../signature-requests/entities/signature-request.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  passwordHash: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  company: string;

  @Column({ default: false })
  isVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Document, document => document.owner)
  documents: Document[];

  @OneToMany(() => SignatureRequest, request => request.requester)
  signatureRequests: SignatureRequest[];

  @OneToMany(() => SignatureRequest, request => request.signer)
  signingRequests: SignatureRequest[];
} 