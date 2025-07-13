// hrms-backend/src/holiday/holiday.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Query, Res, HttpStatus } from '@nestjs/common';
import { HolidayService } from './holiday.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request, Response } from 'express';
import { IsString, IsNotEmpty, IsDateString, IsBoolean, IsOptional } from 'class-validator';
import { Holiday } from './holiday.entity'; // Import the Holiday entity

class CreateHolidayDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsDateString()
  @IsNotEmpty()
  date: string; // Keep as string for validation, convert in controller

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}

class UpdateHolidayDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsDateString()
  @IsOptional()
  date?: string; // Keep as string for validation, convert in controller

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}

@UseGuards(JwtAuthGuard)
@Controller('holidays')
export class HolidayController {
  constructor(private readonly holidayService: HolidayService) {}

  @Post()
  async create(@Req() req: Request, @Res() res: Response, @Body() createHolidayDto: CreateHolidayDto) {
    const tenantId = req.user.tenantId;
    try {
      // Explicitly build the object with the date converted to a Date object
      const holidayToCreate: Partial<Holiday> = {
        name: createHolidayDto.name,
        date: new Date(createHolidayDto.date), // Convert date string to Date object here
        isPublic: createHolidayDto.isPublic,
      };
      const holiday = await this.holidayService.create(holidayToCreate, tenantId);
      res.status(HttpStatus.CREATED).json(holiday);
    } catch (error) {
      if (error.message.includes('required')) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message || 'Failed to create holiday' });
    }
  }

  @Get()
  async findAll(@Req() req: Request, @Res() res: Response, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const tenantId = req.user.tenantId;
    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;

    if (startDate) {
      parsedStartDate = new Date(startDate);
      if (isNaN(parsedStartDate.getTime())) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Invalid startDate format.' });
      }
    }
    if (endDate) {
      parsedEndDate = new Date(endDate);
      if (isNaN(parsedEndDate.getTime())) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Invalid endDate format.' });
      }
    }
    if (parsedStartDate && parsedEndDate && parsedStartDate > parsedEndDate) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: 'startDate cannot be after endDate.' });
    }

    try {
      const holidays = await this.holidayService.findAll(tenantId, parsedStartDate, parsedEndDate);
      res.status(HttpStatus.OK).json(holidays);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message || 'Failed to retrieve holidays' });
    }
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Res() res: Response, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    try {
      const holiday = await this.holidayService.findOne(id, tenantId);
      res.status(HttpStatus.OK).json(holiday);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message || 'Failed to retrieve holiday' });
    }
  }

  @Put(':id')
  async update(@Req() req: Request, @Res() res: Response, @Param('id') id: string, @Body() updateHolidayDto: UpdateHolidayDto) {
    const tenantId = req.user.tenantId;
    try {
      // Explicitly build the object and convert date if present
      const holidayToUpdate: Partial<Holiday> = {};
      if (updateHolidayDto.name !== undefined) {
          holidayToUpdate.name = updateHolidayDto.name;
      }
      if (updateHolidayDto.isPublic !== undefined) {
          holidayToUpdate.isPublic = updateHolidayDto.isPublic;
      }
      if (updateHolidayDto.date !== undefined) {
          holidayToUpdate.date = new Date(updateHolidayDto.date); // Convert date string to Date object here
      }

      const updatedHoliday = await this.holidayService.update(id, holidayToUpdate, tenantId);
      res.status(HttpStatus.OK).json(updatedHoliday);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.BAD_REQUEST).json({ message: error.message || 'Failed to update holiday' });
    }
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Res() res: Response, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    try {
      await this.holidayService.remove(id, tenantId);
      res.status(HttpStatus.NO_CONTENT).send();
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to delete holiday', error: error.message });
    }
  }
}