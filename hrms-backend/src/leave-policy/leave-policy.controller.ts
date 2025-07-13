// hrms-backend/src/leave-policy/leave-policy.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Res, HttpStatus } from '@nestjs/common';
import { LeavePolicyService } from './leave-policy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request, Response } from 'express';
import { IsString, IsNotEmpty, IsNumber, Min, IsBoolean, IsOptional, IsArray, IsEnum } from 'class-validator';

enum AccrualUnit {
  MONTH = 'month',
  YEAR = 'year',
  ONCE = 'once',
}

class CreateLeavePolicyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  accrualRate: number;

  @IsString()
  @IsEnum(AccrualUnit)
  @IsOptional()
  accrualUnit?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxAccumulation?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxPerRequest?: number;

  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicableRoles?: string[];
}

class UpdateLeavePolicyDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  accrualRate?: number;

  @IsString()
  @IsEnum(AccrualUnit)
  @IsOptional()
  accrualUnit?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxAccumulation?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxPerRequest?: number;

  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicableRoles?: string[];
}

@UseGuards(JwtAuthGuard)
@Controller('leave-policies')
export class LeavePolicyController {
  constructor(private readonly leavePolicyService: LeavePolicyService) {}

  @Post()
  async create(@Req() req: Request, @Res() res: Response, @Body() createLeavePolicyDto: CreateLeavePolicyDto) {
    const tenantId = req.user.tenantId;
    try {
      const policy = await this.leavePolicyService.create(createLeavePolicyDto, tenantId);
      res.status(HttpStatus.CREATED).json(policy);
    } catch (error) {
      if (error.message.includes('required') || error.message.includes('exists') || error.message.includes('Invalid')) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message || 'Failed to create leave policy' });
    }
  }

  @Get()
  async findAll(@Req() req: Request, @Res() res: Response) {
    const tenantId = req.user.tenantId;
    try {
      const policies = await this.leavePolicyService.findAll(tenantId);
      res.status(HttpStatus.OK).json(policies);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message || 'Failed to retrieve leave policies' });
    }
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Res() res: Response, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    try {
      const policy = await this.leavePolicyService.findOne(id, tenantId);
      res.status(HttpStatus.OK).json(policy);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message || 'Failed to retrieve leave policy' });
    }
  }

  @Put(':id')
  async update(@Req() req: Request, @Res() res: Response, @Param('id') id: string, @Body() updateLeavePolicyDto: UpdateLeavePolicyDto) {
    const tenantId = req.user.tenantId;
    try {
      const updatedPolicy = await this.leavePolicyService.update(id, updateLeavePolicyDto, tenantId);
      res.status(HttpStatus.OK).json(updatedPolicy);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      if (error.message.includes('exists') || error.message.includes('Invalid')) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
      }
      res.status(HttpStatus.BAD_REQUEST).json({ message: error.message || 'Failed to update leave policy' });
    }
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Res() res: Response, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    try {
      await this.leavePolicyService.remove(id, tenantId);
      res.status(HttpStatus.NO_CONTENT).send();
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to delete leave policy', error: error.message });
    }
  }
}