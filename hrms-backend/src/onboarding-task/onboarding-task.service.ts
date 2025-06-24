import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnboardingTask } from './onboarding-task.entity';
import { CreateOnboardingTaskDto } from './dto/create-onboarding-task.dto'; // Ensure this import path is correct
import { UpdateOnboardingTaskDto } from './dto/update-onboarding-task.dto'; // Ensure this import path is correct
import { EmployeeService } from '../employee/employee.service'; // Needed to validate employeeId

@Injectable()
export class OnboardingTaskService {
  constructor(
    @InjectRepository(OnboardingTask)
    private onboardingTasksRepository: Repository<OnboardingTask>,
    private employeeService: EmployeeService, // Inject EmployeeService
  ) {}

  async create(createOnboardingTaskDto: CreateOnboardingTaskDto, tenantId: string): Promise<OnboardingTask> {
    const { employeeId, task, dueDate } = createOnboardingTaskDto;

    // Validate employee exists for this tenant
    await this.employeeService.findOne(employeeId, tenantId);

    // Convert dueDate string to Date object and validate
    const parsedDueDate = new Date(dueDate);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Reset time for comparison

    if (isNaN(parsedDueDate.getTime())) {
      throw new BadRequestException('Invalid due date format provided.');
    }
    if (parsedDueDate < today) {
      throw new BadRequestException('Due date cannot be in the past.');
    }

    const newOnboardingTask = this.onboardingTasksRepository.create({
      ...createOnboardingTaskDto,
      tenantId,
      dueDate: parsedDueDate, // Use the parsed Date object
      completed: createOnboardingTaskDto.completed ?? false, // Default to false if not provided
    });

    return this.onboardingTasksRepository.save(newOnboardingTask);
  }

  async findAll(tenantId: string, employeeId?: string, completed?: boolean): Promise<OnboardingTask[]> {
    const whereClause: any = { tenantId };
    if (employeeId) {
      whereClause.employeeId = employeeId;
    }
    if (typeof completed === 'boolean') {
      whereClause.completed = completed;
    }

    return this.onboardingTasksRepository.find({
      where: whereClause,
      relations: ['employee'], // Load employee data
      order: { dueDate: 'ASC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<OnboardingTask> {
    const task = await this.onboardingTasksRepository.findOne({
      where: { id, tenantId },
      relations: ['employee'],
    });
    if (!task) {
      throw new NotFoundException(`Onboarding task with ID "${id}" not found for this tenant.`);
    }
    return task;
  }

  async update(id: string, updateOnboardingTaskDto: UpdateOnboardingTaskDto, tenantId: string): Promise<OnboardingTask> {
    const task = await this.onboardingTasksRepository.findOne({
      where: { id, tenantId },
    });
    if (!task) {
      throw new NotFoundException(`Onboarding task with ID "${id}" not found for this tenant.`);
    }

    // Validate employeeId if provided
    if (updateOnboardingTaskDto.employeeId) {
      await this.employeeService.findOne(updateOnboardingTaskDto.employeeId, tenantId);
    }

    // Validate dueDate if provided
    if (updateOnboardingTaskDto.dueDate !== undefined) {
      const parsedDueDate = new Date(updateOnboardingTaskDto.dueDate);
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      if (isNaN(parsedDueDate.getTime())) {
        throw new BadRequestException('Invalid due date format provided.');
      }
      if (parsedDueDate < today && !updateOnboardingTaskDto.completed) {
        throw new BadRequestException('Due date cannot be in the past for an incomplete task.');
      }
      task.dueDate = parsedDueDate; // Assign parsed date
    }

    this.onboardingTasksRepository.merge(task, updateOnboardingTaskDto);
    return this.onboardingTasksRepository.save(task);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const result = await this.onboardingTasksRepository.delete({ id, tenantId });
    if (result.affected === 0) {
      throw new NotFoundException(`Onboarding task with ID "${id}" not found for this tenant.`);
    }
  }
}