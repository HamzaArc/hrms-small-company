import { Controller, Get, Post, Put, Delete, Body, Param, HttpStatus, Res, Query } from '@nestjs/common';
import { ReviewService } from './review.service';
import { Response } from 'express';

// Placeholder for tenantId. In a real app, this would come from authentication.
const DUMMY_TENANT_ID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef'; // Use the same dummy tenant ID

@Controller('reviews') // API endpoint prefix
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  // POST /reviews - Create a new review
  @Post()
  async create(@Body() createReviewDto: any, @Res() res: Response) {
    const tenantId = createReviewDto.tenantId || DUMMY_TENANT_ID;

    if (!tenantId) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'tenantId is required.' });
    }
    if (!createReviewDto.employeeId || !createReviewDto.reviewer || !createReviewDto.reviewPeriod || createReviewDto.rating === undefined || !createReviewDto.comments) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Missing required fields: employeeId, reviewer, reviewPeriod, rating, comments.' });
    }

    try {
      const review = await this.reviewService.create(createReviewDto, tenantId);
      res.status(HttpStatus.CREATED).json(review);
    } catch (error) {
      if (error.message.includes('rating must be') || error.message.includes('required fields') || error.message.includes('not found')) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to create review', error: error.message });
    }
  }

  // GET /reviews - Get all reviews for a tenant (with optional employeeId filter)
  @Get()
  async findAll(
    @Query('employeeId') employeeId: string,
    @Res() res: Response
  ) {
    const tenantId = DUMMY_TENANT_ID; // From authentication in real app

    try {
      const reviews = await this.reviewService.findAll(tenantId, employeeId);
      res.status(HttpStatus.OK).json(reviews);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to retrieve reviews', error: error.message });
    }
  }

  // GET /reviews/:id - Get a specific review
  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    const tenantId = DUMMY_TENANT_ID; // From authentication in real app

    try {
      const review = await this.reviewService.findOne(id, tenantId);
      res.status(HttpStatus.OK).json(review);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to retrieve review', error: error.message });
    }
  }

  // PUT /reviews/:id - Update a review
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateReviewDto: any, @Res() res: Response) {
    const tenantId = updateReviewDto.tenantId || DUMMY_TENANT_ID;
    if (!tenantId) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'tenantId is required in the request body or via authentication.' });
    }

    try {
      const review = await this.reviewService.update(id, updateReviewDto, tenantId);
      res.status(HttpStatus.OK).json(review);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      if (error.message.includes('rating must be') || error.message.includes('linkedGoals must be')) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to update review', error: error.message });
    }
  }

  // DELETE /reviews/:id - Delete a review
  @Delete(':id')
  async remove(@Param('id') id: string, @Body('tenantId') tenantId: string, @Res() res: Response) {
    // For DELETE, tenantId needs to be provided in the request body for simplicity now
    if (!tenantId) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'tenantId is required in the request body.' });
    }

    try {
      await this.reviewService.remove(id, tenantId);
      res.status(HttpStatus.NO_CONTENT).send(); // 204 No Content for successful deletion
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to delete review', error: error.message });
    }
  }
}