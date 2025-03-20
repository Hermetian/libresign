import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SignatureRequestsController } from './signature-requests.controller';
import { SignatureRequestsService } from './signature-requests.service';
import { SignatureRequest } from './entities/signature-request.entity';
import { Signature } from './entities/signature.entity';
import { DocumentsModule } from '../documents/documents.module';
import { MailModule } from '../mail/mail.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([SignatureRequest, Signature]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
    DocumentsModule,
    MailModule,
  ],
  controllers: [SignatureRequestsController],
  providers: [SignatureRequestsService],
  exports: [SignatureRequestsService],
})
export class SignatureRequestsModule {}