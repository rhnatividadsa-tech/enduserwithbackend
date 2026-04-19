import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsDateString,
  IsOptional,
} from 'class-validator';

/**
 * DTO for user registration.
 *
 * The `whitelist: true` + `forbidNonWhitelisted: true` global pipe
 * ensures that ANY extra properties (e.g. `role: 'admin'`) sent by a
 * malicious client are automatically stripped / rejected BEFORE they
 * reach the service layer.
 */
export class CreateUserDto {
  @IsEmail({}, { message: 'A valid email address is required.' })
  @IsNotEmpty()
  email!: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters.' })
  @MaxLength(72, { message: 'Password must not exceed 72 characters.' })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'First name is required.' })
  @MaxLength(100)
  first_name!: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name is required.' })
  @MaxLength(100)
  last_name!: string;

  @IsString()
  @IsNotEmpty({ message: 'Phone number is required.' })
  @Matches(/^\+?[0-9\s\-()]{7,20}$/, {
    message: 'Phone number must be a valid format (e.g. +639171234567).',
  })
  phone!: string;

  @IsDateString({}, { message: 'Date of birth must be a valid ISO date (YYYY-MM-DD).' })
  @IsNotEmpty()
  dob!: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  barangay?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  municipality?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  province?: string;
}
