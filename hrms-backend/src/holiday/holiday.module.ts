// hrms-backend/src/holiday/holiday.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HolidayService } from './holiday.service';
import { HolidayController } from './holiday.controller';
import { Holiday } from './holiday.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Holiday])],
  providers: [HolidayService],
  controllers: [HolidayController],
  exports: [HolidayService], // Export so LeaveRequestService can use it
})
export class HolidayModule {}