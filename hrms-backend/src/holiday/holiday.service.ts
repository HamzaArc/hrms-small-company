// hrms-backend/src/holiday/holiday.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Holiday } from './holiday.entity';

@Injectable()
export class HolidayService {
  constructor(
    @InjectRepository(Holiday)
    private holidaysRepository: Repository<Holiday>,
  ) {}

  // CREATE Holiday
  async create(holidayData: Partial<Holiday>, tenantId: string): Promise<Holiday> {
    if (!holidayData.name || !holidayData.date) {
      throw new BadRequestException('Holiday name and date are required.');
    }

    const newHoliday = this.holidaysRepository.create({
      ...holidayData,
      tenantId,
      date: new Date(holidayData.date),
      isPublic: holidayData.isPublic ?? true,
    });
    return this.holidaysRepository.save(newHoliday);
  }

  // READ All Holidays for a Tenant, optionally within a date range
  async findAll(tenantId: string, startDate?: Date, endDate?: Date): Promise<Holiday[]> {
    const whereClause: any = { tenantId: tenantId };
    if (startDate && endDate) {
      whereClause.date = Between(startDate, endDate);
    } else if (startDate) {
      whereClause.date = Between(startDate, new Date('9999-12-31')); // Effectively >= startDate
    } else if (endDate) {
      whereClause.date = Between(new Date('1900-01-01'), endDate); // Effectively <= endDate
    }

    return this.holidaysRepository.find({
      where: whereClause,
      order: { date: 'ASC' },
    });
  }

  // READ One Holiday by ID for a Tenant
  async findOne(id: string, tenantId: string): Promise<Holiday> {
    const holiday = await this.holidaysRepository.findOne({
      where: { id: id, tenantId: tenantId },
    });
    if (!holiday) {
      throw new NotFoundException(`Holiday with ID "${id}" not found for this tenant.`);
    }
    return holiday;
  }

  // UPDATE Holiday
  async update(id: string, holidayData: Partial<Holiday>, tenantId: string): Promise<Holiday> {
    const holiday = await this.holidaysRepository.findOne({
      where: { id: id, tenantId: tenantId },
    });
    if (!holiday) {
      throw new NotFoundException(`Holiday with ID "${id}" not found for this tenant.`);
    }

    this.holidaysRepository.merge(holiday, holidayData);
    return this.holidaysRepository.save(holiday);
  }

  // DELETE Holiday
  async remove(id: string, tenantId: string): Promise<void> {
    const result = await this.holidaysRepository.delete({ id: id, tenantId: tenantId });
    if (result.affected === 0) {
      throw new NotFoundException(`Holiday with ID "${id}" not found for this tenant.`);
    }
  }
}