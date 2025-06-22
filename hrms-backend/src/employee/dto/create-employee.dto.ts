import { IsString, IsEmail, IsNotEmpty, IsOptional, IsIn, IsDateString, IsNumber, Min } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsString()
  @IsNotEmpty()
  department: string;

  @IsDateString()
  @IsNotEmpty()
  hireDate: string;

  @IsString()
  @IsOptional()
  @IsIn(['Active', 'Inactive'])
  status?: string;
  
  // FIX: Add optional leave balance properties for creation
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