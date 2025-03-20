import { IsNotEmpty, IsString, IsEmail, IsOptional, IsUUID, IsArray } from 'class-validator';

export class CreateSignatureRequestDto {
  @IsUUID()
  @IsNotEmpty()
  documentId: string;

  @IsEmail()
  @IsNotEmpty()
  signerEmail: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsOptional()
  @IsArray()
  signingFields?: SigningField[];
}

export class SigningField {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsNotEmpty()
  positionX: number;

  @IsNotEmpty()
  positionY: number;

  @IsNotEmpty()
  page: number;
}