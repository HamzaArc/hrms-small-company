import { IsString, IsNotEmpty, IsUUID, IsDateString, IsBoolean, IsOptional } from 'class-validator';

export class CreateOnboardingTaskDto {
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  task: string;

  @IsDateString()
  @IsNotEmpty()
  dueDate: string; // Will be converted to Date in service

  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}