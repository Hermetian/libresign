import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class SignDocumentDto {
  @IsString()
  @IsNotEmpty()
  signatureData: string;

  @IsString()
  @IsNotEmpty()
  signatureType: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsBoolean()
  @IsNotEmpty()
  consentToElectronicSignature: boolean;
}