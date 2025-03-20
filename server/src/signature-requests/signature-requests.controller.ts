import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SignatureRequestsService } from './signature-requests.service';
import { CreateSignatureRequestDto } from './dto/create-signature-request.dto';
import { SignDocumentDto } from './dto/sign-document.dto';

@Controller('signature-requests')
export class SignatureRequestsController {
  constructor(private readonly signatureRequestsService: SignatureRequestsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createSignatureRequestDto: CreateSignatureRequestDto, @Request() req) {
    return this.signatureRequestsService.create(createSignatureRequestDto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Request() req, @Query('type') type: string) {
    return this.signatureRequestsService.findAll(req.user.id, type);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.signatureRequestsService.findOne(id, req.user.id);
  }

  @Get('sign/:id')
  getSigningSession(@Param('id') id: string, @Query('token') token: string) {
    return this.signatureRequestsService.getSigningSession(id, token);
  }

  @Post('sign/:id')
  signDocument(
    @Param('id') id: string,
    @Body() signDocumentDto: SignDocumentDto,
    @Query('token') token: string,
  ) {
    return this.signatureRequestsService.signDocument(id, signDocumentDto, token);
  }
}