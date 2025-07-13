// hrms-backend/src/employee/dto/update-employee.dto.ts
import { IsString, IsEmail, IsOptional, IsIn, IsNumber, Min, IsUUID, IsObject } from 'class-validator';

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

  // REMOVED: Fixed leave balance properties
  // @IsNumber()
  // @IsOptional()
  // @Min(0)
  // vacationBalance?: number;

  // @IsNumber()
  // @IsOptional()
  // @Min(0)
  // sickBalance?: number;

  // @IsNumber()
  // @IsOptional()
  // @Min(0)
  // personalBalance?: number;

  @IsUUID()
  @IsOptional()
  leavePolicyId?: string; // NEW: Allow updating leave policy by ID

  @IsObject()
  @IsOptional()
  leaveBalances?: { [key: string]: number }; // NEW: Allow updating dynamic leave balances
}