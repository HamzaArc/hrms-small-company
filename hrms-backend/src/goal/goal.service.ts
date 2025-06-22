import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal } from './goal.entity';
import { EmployeeService } from '../employee/employee.service'; // To validate employee existence

@Injectable()
export class GoalService {
  constructor(
    @InjectRepository(Goal)
    private goalsRepository: Repository<Goal>,
    private employeeService: EmployeeService, // Inject EmployeeService
  ) {}

  // CREATE Goal
  async create(goalData: Partial<Goal>, tenantId: string): Promise<Goal> {
    // Validate employee exists for this tenant
    await this.employeeService.findOne(goalData.employeeId as string, tenantId);

    // Validate due date
    // FIX: Use non-null assertion (!) because controller validation ensures it exists
    const dueDate = new Date(goalData.dueDate!);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for comparison

    if (dueDate <= today) {
      throw new BadRequestException('Due date must be in the future.');
    }

    const newGoal = this.goalsRepository.create({
      ...goalData,
      tenantId,
      createdDate: new Date(), // Set createdDate to now
      status: goalData.status || 'Not Started', // Default status if not provided
      keyResults: goalData.keyResults || [], // Ensure keyResults is an array
    });
    return this.goalsRepository.save(newGoal);
  }

  // READ All Goals for a Tenant (with optional employee and status filters)
  async findAll(tenantId: string, employeeId?: string, status?: string): Promise<Goal[]> {
    const whereClause: any = { tenantId: tenantId };
    if (employeeId) {
      whereClause.employeeId = employeeId;
    }
    if (status) {
      whereClause.status = status;
    }

    return this.goalsRepository.find({
      where: whereClause,
      relations: ['employee'], // Load employee data
      order: { dueDate: 'ASC', createdAt: 'DESC' },
    });
  }

  // READ One Goal by ID for a Tenant
  async findOne(id: string, tenantId: string): Promise<Goal> {
    const goal = await this.goalsRepository.findOne({
      where: { id: id, tenantId: tenantId },
      relations: ['employee'],
    });
    if (!goal) {
      throw new NotFoundException(`Goal with ID "${id}" not found for this tenant.`);
    }
    return goal;
  }

  // UPDATE Goal
  async update(id: string, goalData: Partial<Goal>, tenantId: string): Promise<Goal> {
    const goal = await this.goalsRepository.findOne({
      where: { id: id, tenantId: tenantId },
    });
    if (!goal) {
      throw new NotFoundException(`Goal with ID "${id}" not found for this tenant.`);
    }

    if (goalData.dueDate !== undefined) {
        // FIX: Use non-null assertion (!) here too
        const dueDate = new Date(goalData.dueDate!);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dueDate <= today && goalData.status !== 'Completed') { // Allow updating past date if status is completed
            throw new BadRequestException('Due date must be in the future or goal must be completed.');
        }
    }

    // Ensure keyResults is treated as an array if provided
    if (goalData.keyResults !== undefined && !Array.isArray(goalData.keyResults)) {
        throw new BadRequestException('keyResults must be an array of strings.');
    }

    this.goalsRepository.merge(goal, goalData);
    return this.goalsRepository.save(goal);
  }

  // DELETE Goal
  async remove(id: string, tenantId: string): Promise<void> {
    const result = await this.goalsRepository.delete({ id: id, tenantId: tenantId });
    if (result.affected === 0) {
      throw new NotFoundException(`Goal with ID "${id}" not found for this tenant.`);
    }
  }
}