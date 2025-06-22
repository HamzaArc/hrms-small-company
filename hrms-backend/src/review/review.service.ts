import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './review.entity';
import { EmployeeService } from '../employee/employee.service'; // To validate employee existence
import { GoalService } from '../goal/goal.service'; // To validate linked goals

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
    private employeeService: EmployeeService, // Inject EmployeeService
    private goalService: GoalService, // Inject GoalService
  ) {}

  // CREATE Review
  async create(reviewData: Partial<Review>, tenantId: string): Promise<Review> {
    // Validate employee exists
    await this.employeeService.findOne(reviewData.employeeId as string, tenantId);

    // Validate rating
    if (reviewData.rating === undefined || reviewData.rating < 1 || reviewData.rating > 5) {
      throw new BadRequestException('Overall rating must be between 1 and 5.');
    }
    if (!reviewData.reviewer || !reviewData.reviewPeriod || !reviewData.comments) {
      throw new BadRequestException('Reviewer, review period, and overall comments are required.');
    }

    // Validate linked goals exist for this employee/tenant (optional, but good practice)
    if (reviewData.linkedGoals && reviewData.linkedGoals.length > 0) {
        for (const goalId of reviewData.linkedGoals) {
            try {
                await this.goalService.findOne(goalId, tenantId); // Check if goal exists for tenant
            } catch (error) {
                throw new BadRequestException(`Linked goal with ID "${goalId}" not found or does not belong to this tenant.`);
            }
        }
    }

    const newReview = this.reviewsRepository.create({
      ...reviewData,
      tenantId,
      reviewDate: new Date(), // Set reviewDate to now
      ratings: reviewData.ratings || {}, // Ensure ratings is an object
      linkedGoals: reviewData.linkedGoals || [], // Ensure linkedGoals is an array
    });
    return this.reviewsRepository.save(newReview);
  }

  // READ All Reviews for a Tenant (with optional employee filter)
  async findAll(tenantId: string, employeeId?: string): Promise<Review[]> {
    const whereClause: any = { tenantId: tenantId };
    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    return this.reviewsRepository.find({
      where: whereClause,
      relations: ['employee'], // Load employee data
      order: { reviewDate: 'DESC', createdAt: 'DESC' },
    });
  }

  // READ One Review by ID for a Tenant
  async findOne(id: string, tenantId: string): Promise<Review> {
    const review = await this.reviewsRepository.findOne({
      where: { id: id, tenantId: tenantId },
      relations: ['employee'],
    });
    if (!review) {
      throw new NotFoundException(`Review with ID "${id}" not found for this tenant.`);
    }
    return review;
  }

  // UPDATE Review
  async update(id: string, reviewData: Partial<Review>, tenantId: string): Promise<Review> {
    const review = await this.reviewsRepository.findOne({
      where: { id: id, tenantId: tenantId },
    });
    if (!review) {
      throw new NotFoundException(`Review with ID "${id}" not found for this tenant.`);
    }

    // Validate rating if provided
    if (reviewData.rating !== undefined && (reviewData.rating < 1 || reviewData.rating > 5)) {
      throw new BadRequestException('Overall rating must be between 1 and 5.');
    }

    // Validate linked goals if provided
    if (reviewData.linkedGoals !== undefined) {
        if (!Array.isArray(reviewData.linkedGoals)) {
            throw new BadRequestException('linkedGoals must be an array of strings.');
        }
        // Optional: Re-validate if goals exist for tenant, similar to create
        for (const goalId of reviewData.linkedGoals) {
            try {
                await this.goalService.findOne(goalId, tenantId);
            } catch (error) {
                throw new BadRequestException(`Linked goal with ID "${goalId}" not found or does not belong to this tenant.`);
            }
        }
    }

    this.reviewsRepository.merge(review, reviewData);
    return this.reviewsRepository.save(review);
  }

  // DELETE Review
  async remove(id: string, tenantId: string): Promise<void> {
    const result = await this.reviewsRepository.delete({ id: id, tenantId: tenantId });
    if (result.affected === 0) {
      throw new NotFoundException(`Review with ID "${id}" not found for this tenant.`);
    }
  }
}