import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from './announcement.entity';

@Injectable()
export class AnnouncementService {
  constructor(
    @InjectRepository(Announcement)
    private announcementsRepository: Repository<Announcement>,
  ) {}

  // CREATE Announcement
  async create(announcementData: Partial<Announcement>, tenantId: string): Promise<Announcement> {
    if (!announcementData.title || !announcementData.content || !announcementData.category || !announcementData.author) {
      throw new BadRequestException('Title, content, category, and author are required fields.');
    }

    // Validate dates (if provided)
    const publishDate = new Date(announcementData.publishDate!); // Controller ensures presence
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for comparison

    if (publishDate < today) {
        throw new BadRequestException('Publish date cannot be in the past.');
    }

    if (announcementData.expiryDate) {
      const expiryDate = new Date(announcementData.expiryDate!);
      if (expiryDate <= publishDate) {
        throw new BadRequestException('Expiry date must be after publish date.');
      }
    }

    const newAnnouncement = this.announcementsRepository.create({
      ...announcementData,
      tenantId,
      publishDate: publishDate, // Use the validated date object
      isActive: announcementData.isActive ?? true, // Default to true if not provided
    });
    return this.announcementsRepository.save(newAnnouncement);
  }

  // READ All Announcements for a Tenant (with optional category/priority filters)
  async findAll(tenantId: string, category?: string, priority?: string): Promise<Announcement[]> {
    const whereClause: any = { tenantId: tenantId };
    if (category) {
      whereClause.category = category;
    }
    if (priority) {
      whereClause.priority = priority;
    }

    return this.announcementsRepository.find({
      where: whereClause,
      order: { publishDate: 'DESC', createdAt: 'DESC' },
    });
  }

  // READ One Announcement by ID for a Tenant
  async findOne(id: string, tenantId: string): Promise<Announcement> {
    const announcement = await this.announcementsRepository.findOne({
      where: { id: id, tenantId: tenantId },
    });
    if (!announcement) {
      throw new NotFoundException(`Announcement with ID "${id}" not found for this tenant.`);
    }
    return announcement;
  }

  // UPDATE Announcement
  async update(id: string, announcementData: Partial<Announcement>, tenantId: string): Promise<Announcement> {
    const announcement = await this.announcementsRepository.findOne({
      where: { id: id, tenantId: tenantId },
    });
    if (!announcement) {
      throw new NotFoundException(`Announcement with ID "${id}" not found for this tenant.`);
    }

    if (announcementData.publishDate !== undefined) {
        const publishDate = new Date(announcementData.publishDate!);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (publishDate < today) {
            throw new BadRequestException('Publish date cannot be in the past.');
        }
    }
    if (announcementData.expiryDate !== undefined) {
        const expiryDate = new Date(announcementData.expiryDate!);
        const publishDate = new Date(announcementData.publishDate || announcement.publishDate); // Use new publish date if provided, else existing
        if (expiryDate <= publishDate) {
            throw new BadRequestException('Expiry date must be after publish date.');
        }
    }

    this.announcementsRepository.merge(announcement, announcementData);
    return this.announcementsRepository.save(announcement);
  }

  // DELETE Announcement
  async remove(id: string, tenantId: string): Promise<void> {
    const result = await this.announcementsRepository.delete({ id: id, tenantId: tenantId });
    if (result.affected === 0) {
      throw new NotFoundException(`Announcement with ID "${id}" not found for this tenant.`);
    }
  }
}