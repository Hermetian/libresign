import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SignatureRequest, SignatureRequestStatus } from './entities/signature-request.entity';
import { Signature } from './entities/signature.entity';
import { CreateSignatureRequestDto } from './dto/create-signature-request.dto';
import { SignDocumentDto } from './dto/sign-document.dto';
import { DocumentsService } from '../documents/documents.service';
import { MailService } from '../mail/mail.service';
import * as crypto from 'crypto';

@Injectable()
export class SignatureRequestsService {
  constructor(
    @InjectRepository(SignatureRequest)
    private signatureRequestRepository: Repository<SignatureRequest>,
    @InjectRepository(Signature)
    private signatureRepository: Repository<Signature>,
    private documentsService: DocumentsService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  async create(
    createSignatureRequestDto: CreateSignatureRequestDto,
    requesterId: string,
  ) {
    // Verify document exists and user has access
    await this.documentsService.findOne(
      createSignatureRequestDto.documentId,
      requesterId,
    );

    // Create signature request
    const signatureRequest = new SignatureRequest();
    signatureRequest.documentId = createSignatureRequestDto.documentId;
    signatureRequest.requesterId = requesterId;
    signatureRequest.signerEmail = createSignatureRequestDto.signerEmail;
    if (createSignatureRequestDto.message) {
      signatureRequest.message = createSignatureRequestDto.message;
    }
    signatureRequest.status = SignatureRequestStatus.PENDING;
    // Set expiration date to 30 days from now
    signatureRequest.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const savedRequest = await this.signatureRequestRepository.save(signatureRequest);

    // Generate signing token
    const token = this.generateSigningToken(savedRequest.id, savedRequest.signerEmail);

    // Send email
    await this.mailService.sendSignatureRequest(
      savedRequest.signerEmail,
      requesterId,
      savedRequest.id,
      token,
      createSignatureRequestDto.documentId,
      createSignatureRequestDto.message,
    );

    return savedRequest;
  }

  async findAll(userId: string, type?: string) {
    if (type === 'sent') {
      return this.signatureRequestRepository.find({
        where: { requesterId: userId },
        order: { createdAt: 'DESC' },
        relations: ['document'],
      });
    } else if (type === 'received') {
      return this.signatureRequestRepository.find({
        where: { signerEmail: userId },
        order: { createdAt: 'DESC' },
        relations: ['document'],
      });
    }

    // Default: return all requests involving the user
    return this.signatureRequestRepository.find({
      where: [{ requesterId: userId }, { signerId: userId }],
      order: { createdAt: 'DESC' },
      relations: ['document'],
    });
  }

  async findOne(id: string, userId: string) {
    const signatureRequest = await this.signatureRequestRepository.findOne({
      where: { id },
      relations: ['document'],
    });

    if (!signatureRequest) {
      throw new NotFoundException(`Signature request with ID ${id} not found`);
    }

    // Check if user is the requester or signer
    if (
      signatureRequest.requesterId !== userId &&
      signatureRequest.signerId !== userId
    ) {
      throw new UnauthorizedException('You do not have access to this signature request');
    }

    return signatureRequest;
  }

  async getSigningSession(id: string, token: string) {
    if (!token) {
      throw new UnauthorizedException('Missing signing token');
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      if (payload.requestId !== id) {
        throw new UnauthorizedException('Invalid signing token');
      }

      const signatureRequest = await this.signatureRequestRepository.findOne({
        where: { id, signerEmail: payload.email },
        relations: ['document'],
      });

      if (!signatureRequest) {
        throw new NotFoundException('Signature request not found');
      }

      if (signatureRequest.status !== SignatureRequestStatus.PENDING) {
        throw new BadRequestException(`Document already ${signatureRequest.status}`);
      }

      if (signatureRequest.expiresAt && new Date() > signatureRequest.expiresAt) {
        signatureRequest.status = SignatureRequestStatus.EXPIRED;
        await this.signatureRequestRepository.save(signatureRequest);
        throw new BadRequestException('Signature request has expired');
      }

      // Get document preview URL (e.g., from S3)
      const documentUrl = await this.documentsService.getDocumentPreviewUrl(
        signatureRequest.documentId,
      );

      return {
        signatureRequest,
        documentUrl,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired signing token');
    }
  }

  async signDocument(id: string, signDocumentDto: SignDocumentDto, token: string) {
    // First verify the token and get the signing session
    const { signatureRequest } = await this.getSigningSession(id, token);

    if (!signDocumentDto.consentToElectronicSignature) {
      throw new BadRequestException('You must consent to electronic signature');
    }

    // Create signature
    const signature = new Signature();
    signature.signatureRequestId = id;
    signature.signerId = signatureRequest.signerId;
    signature.signatureData = signDocumentDto.signatureData;
    signature.signatureType = signDocumentDto.signatureType;
    signature.ipAddress = signDocumentDto.ipAddress || '0.0.0.0';
    signature.signatureHash = this.hashSignature(signDocumentDto.signatureData);
    signature.metadata = signDocumentDto.metadata || {};

    await this.signatureRepository.save(signature);

    // Update signature request
    signatureRequest.status = SignatureRequestStatus.COMPLETED;
    signatureRequest.signedAt = new Date();
    await this.signatureRequestRepository.save(signatureRequest);

    // Update document with signature
    await this.documentsService.applySignature(
      signatureRequest.documentId,
      signature.id,
    );

    // Send notification emails
    await this.mailService.sendSignatureCompleteNotification(
      signatureRequest.id,
      signatureRequest.requesterId,
      signatureRequest.signerEmail,
    );

    return { success: true, message: 'Document signed successfully' };
  }

  private generateSigningToken(requestId: string, email: string): string {
    return this.jwtService.sign(
      { requestId, email },
      {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '30d',
      },
    );
  }

  private hashSignature(signatureData: string): string {
    return crypto.createHash('sha256').update(signatureData).digest('hex');
  }
}