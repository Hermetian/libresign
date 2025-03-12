import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'john.doe@example.com', description: 'The email of the user' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'StrongPassword123!', description: 'The password of the user' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ example: 'John Doe', description: 'The full name of the user' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'ACME Corp', description: 'The company of the user' })
  @IsString()
  @IsOptional()
  company?: string;
} 