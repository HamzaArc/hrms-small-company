import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recognition } from './recognition.entity';
import { EmployeeService } from '../employee/employee.service'; // To validate recipient existence

@Injectable()
export class RecognitionService {
  constructor(
    @InjectRepository(Recognition)
    private recognitionsRepository: Repository<Recognition>,
    private employeeService: EmployeeService, // Inject EmployeeService
  ) {}

  // CREATE Recognition
  async create(recognitionData: Partial<Recognition>, tenantId: string): Promise<Recognition> {
    // Validate recipient exists for this tenant
    await this.employeeService.findOne(recognitionData.recipientId as string, tenantId);

    if (!recognitionData.category || !recognitionData.value || !recognitionData.message || !recognitionData.givenBy) {
      throw new BadRequestException('Category, value, message, and givenBy are required fields.');
    }
    if ((recognitionData.message as string).length < 20) { // Assert as string for length check
        throw new BadRequestException('Recognition message must be at least 20 characters long.');
    }

    const newRecognition = this.recognitionsRepository.create({
      ...recognitionData,
      tenantId,
      date: new Date(), // Set date to now
      isPublic: recognitionData.isPublic ?? true, // Default to true if not provided
    });
    return this.recognitionsRepository.save(newRecognition);
  }

  // READ All Recognitions for a Tenant (with optional recipientId/category filters)
  async findAll(tenantId: string, recipientId?: string, category?: string): Promise<Recognition[]> {
    const whereClause: any = { tenantId: tenantId };
    if (recipientId) {
      whereClause.recipientId = recipientId;
    }
    if (category) {
      whereClause.category = category;
    }

    return this.recognitionsRepository.find({
      where: whereClause,
      relations: ['recipient'], // Load recipient employee data
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  // READ One Recognition by ID for a Tenant
  async findOne(id: string, tenantId: string): Promise<Recognition> {
    const recognition = await this.recognitionsRepository.findOne({
      where: { id: id, tenantId: tenantId },
      relations: ['recipient'],
    });
    if (!recognition) {
      throw new NotFoundException(`Recognition with ID "${id}" not found for this tenant.`);
    }
    return recognition;
  }

  // UPDATE Recognition
  async update(id: string, recognitionData: Partial<Recognition>, tenantId: string): Promise<Recognition> {
    const recognition = await this.recognitionsRepository.findOne({
      where: { id: id, tenantId: tenantId },
    });
    if (!recognition) {
      throw new NotFoundException(`Recognition with ID "${id}" not found for this tenant.`);
    }

    if (recognitionData.message !== undefined && (recognitionData.message as string).length < 20) {
        throw new BadRequestException('Recognition message must be at least 20 characters long.');
    }

    this.recognitionsRepository.merge(recognition, recognitionData);
    return this.recognitionsRepository.save(recognition);
  }

  // DELETE Recognition
  async remove(id: string, tenantId: string): Promise<void> {
    const result = await this.recognitionsRepository.delete({ id: id, tenantId: tenantId });
    if (result.affected === 0) {
      throw new NotFoundException(`Recognition with ID "${id}" not found for this tenant.`);
    }
  }
}