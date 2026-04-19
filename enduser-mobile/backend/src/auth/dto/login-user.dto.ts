import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginUserDto {
  @IsEmail({}, { message: 'A valid email address is required.' })
  @IsNotEmpty()
  email!: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters.' })
  password!: string;
}
