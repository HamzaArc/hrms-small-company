// hrms-backend/src/employee/dto/create-employee.dto.ts
import { IsString, IsEmail, IsNotEmpty, IsOptional, IsIn, IsDateString, IsNumber, Min } from 'class-validator';

export class CreateEmployeeDto { // FIX: Ensure 'export class' is present
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
}