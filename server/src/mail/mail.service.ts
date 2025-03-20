import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    // For development, we can use a test account from Ethereal
    // In production, this would use real SMTP credentials
    this.setupTransporter();
  }

  private async setupTransporter() {
    // Check if we're using a test account or real credentials
    if (this.configService.get('NODE_ENV') === 'development') {
      // Create a test account
      const testAccount = await nodemailer.createTestAccount();

      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } else {
      // Use real SMTP settings
      this.transporter = nodemailer.createTransport({
        host: this.configService.get('SMTP_HOST'),
        port: this.configService.get('SMTP_PORT'),
        secure: this.configService.get('SMTP_SECURE') === 'true',
        auth: {
          user: this.configService.get('SMTP_USER'),
          pass: this.configService.get('SMTP_PASSWORD'),
        },
      });
    }
  }

  async sendSignatureRequest(
    signerEmail: string,
    requesterId: string,
    requestId: string,
    token: string,
    documentId: string,
    message?: string,
  ): Promise<void> {
    const baseUrl = this.configService.get('FRONTEND_URL');
    const signingUrl = `${baseUrl}/sign/${requestId}?token=${token}`;

    const mailOptions = {
      from: `"LibreSign" <${this.configService.get('MAIL_FROM')}>`,
      to: signerEmail,
      subject: 'Document Signature Request',
      html: `
        <h1>You have a document to sign</h1>
        <p>${message || 'Please sign the attached document.'}</p>
        <p><a href="${signingUrl}">Click here to view and sign the document</a></p>
        <p>This link will expire in 30 days.</p>
      `,
    };

    const info = await this.transporter.sendMail(mailOptions);
    
    // Log the URL for development environments
    if (this.configService.get('NODE_ENV') === 'development') {
      console.log(`Email sent: ${nodemailer.getTestMessageUrl(info)}`);
    }
  }

  async sendSignatureCompleteNotification(
    requestId: string,
    requesterId: string,
    signerEmail: string,
  ): Promise<void> {
    const baseUrl = this.configService.get('FRONTEND_URL');
    const documentUrl = `${baseUrl}/documents/requests/${requestId}`;

    // Email to the requester
    const requesterMailOptions = {
      from: `"LibreSign" <${this.configService.get('MAIL_FROM')}>`,
      to: requesterId,
      subject: 'Document Has Been Signed',
      html: `
        <h1>Your document has been signed</h1>
        <p>The document you sent to ${signerEmail} has been signed.</p>
        <p><a href="${documentUrl}">Click here to view the signed document</a></p>
      `,
    };

    await this.transporter.sendMail(requesterMailOptions);

    // Confirmation email to the signer
    const signerMailOptions = {
      from: `"LibreSign" <${this.configService.get('MAIL_FROM')}>`,
      to: signerEmail,
      subject: 'Document Signed Successfully',
      html: `
        <h1>Document Signed Successfully</h1>
        <p>Thank you for signing the document.</p>
        <p>A copy of the signed document has been sent to the requester.</p>
      `,
    };

    await this.transporter.sendMail(signerMailOptions);
  }
}