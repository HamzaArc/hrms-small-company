import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Query, Res, HttpStatus } from '@nestjs/common';
import { ReviewService } from './review.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request, Response } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  async create(@Req() req: Request, @Res() res: Response, @Body() createReviewDto: any) {
    const tenantId = req.user.tenantId;
    try {
      const review = await this.reviewService.create(createReviewDto, tenantId);
      res.status(HttpStatus.CREATED).json(review);
    } catch (error) {
      // Catch specific errors from service and return appropriate HTTP status
      if (error.message.includes('required') || error.message.includes('rating') || error.message.includes('not found')) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message || 'Failed to create review' });
    }
  }

  @Get()
  async findAll(@Req() req: Request, @Res() res: Response, @Query('employeeId') employeeId?: string) {
    const tenantId = req.user.tenantId;
    try {
      const reviews = await this.reviewService.findAll(tenantId, employeeId);
      res.status(HttpStatus.OK).json(reviews);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message || 'Failed to retrieve reviews' });
    }
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Res() res: Response, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    try {
      const review = await this.reviewService.findOne(id, tenantId);
      res.status(HttpStatus.OK).json(review);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message || 'Failed to retrieve review' });
    }
  }

  @Put(':id')
  async update(@Req() req: Request, @Res() res: Response, @Param('id') id: string, @Body() updateReviewDto: any) {
    const tenantId = req.user.tenantId;
    try {
      const updatedReview = await this.reviewService.update(id, updateReviewDto, tenantId);
      res.status(HttpStatus.OK).json(updatedReview);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      if (error.message.includes('rating')) { // Specific check for rating validation
        return res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
      }
      res.status(HttpStatus.BAD_REQUEST).json({ message: error.message || 'Failed to update review' });
    }
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Res() res: Response, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    try {
      await this.reviewService.remove(id, tenantId);
      res.status(HttpStatus.NO_CONTENT).send();
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to delete review', error: error.message });
    }
  }
}