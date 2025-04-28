import {
    IsEmail,
    IsNotEmpty,
    IsString,
    MinLength,
    IsOptional,
    IsPhoneNumber,
    IsEnum,
  } from 'class-validator';
  
  export enum UserRole {
    USER = 'user',
    EDITOR = 'editor',
    ADMIN = 'admin',
  }
  export class CreateUserDto {
    @IsNotEmpty()
    @IsString()
    name: string;
  
    @IsNotEmpty()
    @IsEmail()
    email: string;
  
    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    password: string;

    @IsNotEmpty()
    @IsPhoneNumber('CO')
    phone: string;

    @IsOptional()
    @IsEnum(UserRole, {message: 'Role must be one of: user, editor, admin'})
    role?: UserRole = UserRole.EDITOR;
  }

  export class UpdateUserDto {
    @IsOptional()
    @IsString()
    name?: string;
  
    @IsOptional()
    @IsEmail()
    email?: string;
  
    @IsOptional()
    @IsString()
    @MinLength(6)
    password?: string;

    @IsOptional()
    @IsEnum(UserRole, {message: 'Role must be one of: user, editor, admin'})
    role?: UserRole;
  }
  
  export class LoginDto {
    @IsNotEmpty()
    @IsEmail()
    email: string;
  
    @IsNotEmpty()
    @IsString()
    password: string;
  }
  
  export class RefreshTokenDto {
    @IsNotEmpty()
    @IsString()
    refreshToken: string;
  }
  
  export class ChangePasswordDto {
    @IsNotEmpty()
    @IsString()
    currentPassword: string;
  
    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    newPassword: string;
  }
  
  export class VerifyEmailDto {
    @IsNotEmpty()
    @IsEmail()
    email: string;
  
    @IsNotEmpty()
    @IsString()
    code: string;
  }