import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { S3 } from '@aws-sdk/client-s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { Document } from './entities/document.entity';
import { AuditLog } from './entities/audit-log.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import * as PDFLib from 'pdf-lib';
import * as crypto from 'crypto';

@Injectable()
export class DocumentsService {
  private s3Client: S3;

  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    private configService: ConfigService,
  ) {
    this.s3Client = new S3({
      region: this.configService.get('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async create(
    file: Express.Multer.File,
    createDocumentDto: CreateDocumentDto,
    userId: string,
  ) {
    const s3Key = `documents/${userId}/${uuidv4()}`;
    
    await this.s3Client.putObject({
      Bucket: this.configService.get('AWS_S3_BUCKET'),
      Key: s3Key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    const document = this.documentsRepository.create({
      title: createDocumentDto.title,
      description: createDocumentDto.description,
      s3Key,
      status: 'draft',
      ownerId: userId,
    });

    const savedDocument = await this.documentsRepository.save(document);

    // Create audit log
    await this.createAuditLog(savedDocument.id, userId, 'upload', 'Document uploaded');

    return savedDocument;
  }

  async findAll(userId: string) {
    return this.documentsRepository.find({
      where: { ownerId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string) {
    const document = await this.documentsRepository.findOne({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    if (document.ownerId !== userId) {
      throw new UnauthorizedException('You do not have access to this document');
    }

    return document;
  }

  async remove(id: string, userId: string) {
    const document = await this.findOne(id, userId);

    // Delete from S3
    await this.s3Client.deleteObject({
      Bucket: this.configService.get('AWS_S3_BUCKET'),
      Key: document.s3Key,
    });

    // Create audit log
    await this.createAuditLog(id, userId, 'delete', 'Document deleted');

    return this.documentsRepository.remove(document);
  }

  async getAuditTrail(id: string, userId: string) {
    // Verify document exists and user has access
    await this.findOne(id, userId);

    return this.auditLogRepository.find({
      where: { documentId: id },
      order: { createdAt: 'DESC' },
    });
  }

  async createAuditLog(
    documentId: string,
    userId: string,
    action: string,
    details: string,
  ) {
    const auditLog = this.auditLogRepository.create({
      documentId,
      userId,
      action,
      details,
    });

    return this.auditLogRepository.save(auditLog);
  }

  async getDocumentPreviewUrl(documentId: string): Promise<string> {
    const document = await this.documentsRepository.findOne({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    // Generate a pre-signed URL for the S3 object
    const command = new GetObjectCommand({
      Bucket: this.configService.get('AWS_S3_BUCKET'),
      Key: document.s3Key,
    });

    // URL expires in 1 hour
    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }

  async applySignature(documentId: string, signatureId: string): Promise<void> {
    const document = await this.documentsRepository.findOne({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    // Get the document from S3
    const getObjectResponse = await this.s3Client.getObject({
      Bucket: this.configService.get('AWS_S3_BUCKET'),
      Key: document.s3Key,
    });

    const pdfBytes = await getObjectResponse.Body.transformToByteArray();
    
    // Load the PDF document
    const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
    
    // Apply the signature - in a real implementation, this would position the signature correctly
    // For now, we're just adding a simple signature indicator to demonstrate the workflow
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    
    firstPage.drawText('Digitally Signed', {
      x: width / 2 - 50,
      y: height - 50,
      size: 12,
    });

    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
    
    // Create a new key for the signed document
    const signedS3Key = `signed-documents/${document.ownerId}/${uuidv4()}.pdf`;
    
    // Upload the signed document to S3
    await this.s3Client.putObject({
      Bucket: this.configService.get('AWS_S3_BUCKET'),
      Key: signedS3Key,
      Body: modifiedPdfBytes,
      ContentType: 'application/pdf',
    });
    
    // Update document in the database
    document.signedS3Key = signedS3Key;
    document.status = 'completed';
    document.documentHash = crypto
      .createHash('sha256')
      .update(Buffer.from(modifiedPdfBytes))
      .digest('hex');
      
    await this.documentsRepository.save(document);
    
    // Create audit log
    await this.createAuditLog(
      documentId,
      document.ownerId,
      'sign',
      `Document signed with signature ID ${signatureId}`,
    );
  }
}