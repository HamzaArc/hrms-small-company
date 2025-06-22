import { IsString, IsEmail, IsOptional, IsIn, IsNumber, Min } from 'class-validator';

export class UpdateEmployeeDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  @IsIn(['Active', 'Inactive'])
  status?: string;

  // --- FIX: Add leave balance properties to allow them to be updated ---
  @IsNumber()
  @IsOptional()
  @Min(0)
  vacationBalance?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  sickBalance?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  personalBalance?: number;
}