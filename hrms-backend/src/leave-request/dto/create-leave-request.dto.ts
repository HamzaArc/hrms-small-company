// hrms-backend/src/leave-request/dto/create-leave-request.dto.ts
import { IsString, IsNotEmpty, IsDateString, IsUUID, IsIn } from 'class-validator';

const validLeaveTypes = ['Vacation', 'Sick', 'Personal'];

export class CreateLeaveRequestDto {
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(validLeaveTypes) // Ensures type is one of the allowed values
  type: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}