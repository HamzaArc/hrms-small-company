import { Controller, Get, Post, Put, Delete, Body, Param, HttpStatus, Res, Query } from '@nestjs/common';
import { GoalService } from './goal.service';
import { Response } from 'express';

// Placeholder for tenantId. In a real app, this would come from authentication.
const DUMMY_TENANT_ID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef'; // Use the same dummy tenant ID

@Controller('goals') // API endpoint prefix
export class GoalController {
  constructor(private readonly goalService: GoalService) {}

  // POST /goals - Create a new goal
  @Post()
  async create(@Body() createGoalDto: any, @Res() res: Response) {
    const tenantId = createGoalDto.tenantId || DUMMY_TENANT_ID;

    if (!tenantId) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'tenantId is required.' });
    }
    if (!createGoalDto.employeeId || !createGoalDto.objective || !createGoalDto.dueDate || !createGoalDto.category) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Missing required fields: employeeId, objective, dueDate, category.' });
    }

    try {
      const goal = await this.goalService.create(createGoalDto, tenantId);
      res.status(HttpStatus.CREATED).json(goal);
    } catch (error) {
      if (error.message.includes('date must be') || error.message.includes('not found')) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to create goal', error: error.message });
    }
  }

  // GET /goals - Get all goals for a tenant (with optional employeeId/status filters)
  @Get()
  async findAll(
    @Query('employeeId') employeeId: string,
    @Query('status') status: string,
    @Res() res: Response
  ) {
    const tenantId = DUMMY_TENANT_ID; // From authentication in real app

    try {
      const goals = await this.goalService.findAll(tenantId, employeeId, status);
      res.status(HttpStatus.OK).json(goals);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to retrieve goals', error: error.message });
    }
  }

  // GET /goals/:id - Get a specific goal
  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    const tenantId = DUMMY_TENANT_ID; // From authentication in real app

    try {
      const goal = await this.goalService.findOne(id, tenantId);
      res.status(HttpStatus.OK).json(goal);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to retrieve goal', error: error.message });
    }
  }

  // PUT /goals/:id - Update a goal
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateGoalDto: any, @Res() res: Response) {
    const tenantId = updateGoalDto.tenantId || DUMMY_TENANT_ID;
    if (!tenantId) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'tenantId is required in the request body or via authentication.' });
    }

    try {
      const goal = await this.goalService.update(id, updateGoalDto, tenantId);
      res.status(HttpStatus.OK).json(goal);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      if (error.message.includes('date must be') || error.message.includes('keyResults must be')) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to update goal', error: error.message });
    }
  }

  // DELETE /goals/:id - Delete a goal
  @Delete(':id')
  async remove(@Param('id') id: string, @Body('tenantId') tenantId: string, @Res() res: Response) {
    // For DELETE, tenantId needs to be provided in the request body for simplicity now
    if (!tenantId) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'tenantId is required in the request body.' });
    }

    try {
      await this.goalService.remove(id, tenantId);
      res.status(HttpStatus.NO_CONTENT).send(); // 204 No Content for successful deletion
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to delete goal', error: error.message });
    }
  }
}