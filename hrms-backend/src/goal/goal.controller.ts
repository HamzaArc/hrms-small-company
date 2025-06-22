import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { GoalService } from './goal.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('goals')
export class GoalController {
  constructor(private readonly goalService: GoalService) {}

  @Post()
  create(@Req() req: Request, @Body() createGoalDto: any) {
    const tenantId = req.user.tenantId;
    return this.goalService.create(createGoalDto, tenantId);
  }

  @Get()
  findAll(@Req() req: Request, @Query('employeeId') employeeId?: string, @Query('status') status?: string) {
    const tenantId = req.user.tenantId;
    return this.goalService.findAll(tenantId, employeeId, status);
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.goalService.findOne(id, tenantId);
  }

  @Put(':id')
  update(@Req() req: Request, @Param('id') id: string, @Body() updateGoalDto: any) {
    const tenantId = req.user.tenantId;
    return this.goalService.update(id, updateGoalDto, tenantId);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.goalService.remove(id, tenantId);
  }
}