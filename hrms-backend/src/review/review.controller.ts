import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { ReviewService } from './review.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  create(@Req() req: Request, @Body() createReviewDto: any) {
    const tenantId = req.user.tenantId;
    return this.reviewService.create(createReviewDto, tenantId);
  }

  @Get()
  findAll(@Req() req: Request, @Query('employeeId') employeeId?: string) {
    const tenantId = req.user.tenantId;
    return this.reviewService.findAll(tenantId, employeeId);
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.reviewService.findOne(id, tenantId);
  }

  @Put(':id')
  update(@Req() req: Request, @Param('id') id: string, @Body() updateReviewDto: any) {
    const tenantId = req.user.tenantId;
    return this.reviewService.update(id, updateReviewDto, tenantId);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.reviewService.remove(id, tenantId);
  }
}