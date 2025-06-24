import { IsString, IsNotEmpty, IsUUID, IsDateString, IsBoolean, IsOptional } from 'class-validator';

// Use Partial to make all fields optional for updates
export class UpdateOnboardingTaskDto {
  @IsUUID()
  @IsOptional()
  employeeId?: string;

  @IsString()
  @IsOptional()
  task?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string; // Will be converted to Date in service

  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}