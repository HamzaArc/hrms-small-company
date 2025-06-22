import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // Import TypeOrmModule
import { AnnouncementService } from './announcement.service';
import { AnnouncementController } from './announcement.controller';
import { Announcement } from './announcement.entity'; // Import the Announcement entity

@Module({
  imports: [
    TypeOrmModule.forFeature([Announcement]), // This line registers the Announcement entity with TypeORM for this module
  ],
  providers: [AnnouncementService],
  controllers: [AnnouncementController],
  exports: [AnnouncementService], // Export AnnouncementService if other modules might need it
})
export class AnnouncementModule {}