import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Query, HttpStatus, Res } from '@nestjs/common';
import { OnboardingTaskService } from './onboarding-task.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request, Response } from 'express'; // Make sure this import is here
import { CreateOnboardingTaskDto } from './dto/create-onboarding-task.dto';
import { UpdateOnboardingTaskDto } from './dto/update-onboarding-task.dto';

@UseGuards(JwtAuthGuard)
@Controller('onboarding-tasks')
export class OnboardingTaskController {
  constructor(private readonly onboardingTaskService: OnboardingTaskService) {}

  @Post()
  async create(@Req() req: Request, @Res() res: Response, @Body() createOnboardingTaskDto: CreateOnboardingTaskDto) {
    const tenantId = req.user.tenantId;
    try {
      const task = await this.onboardingTaskService.create(createOnboardingTaskDto, tenantId);
      res.status(HttpStatus.CREATED).json(task);
    } catch (error) {
      res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
    }
  }

  @Get()
  async findAll(@Req() req: Request, @Res() res: Response, @Query('employeeId') employeeId?: string, @Query('completed') completed?: string) {
    const tenantId = req.user.tenantId;
    const completedBoolean = completed ? completed === 'true' : undefined; // Convert string 'true'/'false' to boolean

    try {
      const tasks = await this.onboardingTaskService.findAll(tenantId, employeeId, completedBoolean);
      res.status(HttpStatus.OK).json(tasks);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to retrieve onboarding tasks', error: error.message });
    }
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Res() res: Response, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    try {
      const task = await this.onboardingTaskService.findOne(id, tenantId);
      res.status(HttpStatus.OK).json(task);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to retrieve onboarding task', error: error.message });
    }
  }

  @Put(':id')
  async update(@Req() req: Request, @Res() res: Response, @Param('id') id: string, @Body() updateOnboardingTaskDto: UpdateOnboardingTaskDto) {
    const tenantId = req.user.tenantId;
    try {
      const updatedTask = await this.onboardingTaskService.update(id, updateOnboardingTaskDto, tenantId);
      res.status(HttpStatus.OK).json(updatedTask);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
    }
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Res() res: Response, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    try {
      await this.onboardingTaskService.remove(id, tenantId);
      res.status(HttpStatus.NO_CONTENT).send();
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to delete onboarding task', error: error.message });
    }
  }
}