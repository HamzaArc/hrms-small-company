import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Tenant } from './tenant/tenant.entity';
import { Employee } from './employee/employee.entity';
import { OnboardingTask } from './onboarding-task/onboarding-task.entity';
import { Document } from './document/document.entity';
import { EmployeeModule } from './employee/employee.module';
import { TenantModule } from './tenant/tenant.module';
import { LeaveRequest } from './leave-request/leave-request.entity'; // Add this import
import { LeaveRequestModule } from './leave-request/leave-request.module';
import { Timesheet } from './timesheet/timesheet.entity'; // Add this import
import { TimesheetModule } from './timesheet/timesheet.module';
import { Goal } from './goal/goal.entity'; // Add this import
import { GoalModule } from './goal/goal.module';
import { Review } from './review/review.entity'; // Add this import
import { ReviewModule } from './review/review.module';
import { Announcement } from './announcement/announcement.entity'; // Add this import
import { AnnouncementModule } from './announcement/announcement.module';
import { Recognition } from './recognition/recognition.entity'; // Add this import
import { RecognitionModule } from './recognition/recognition.module';
import { DocumentModule } from './document/document.module';
import { User } from './user/user.entity'; // Add this import
import { AuthModule } from './auth/auth.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Add this to ensure .env is always loaded in development
      envFilePath: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST as string, // Assert as string
      port: parseInt(process.env.DB_PORT as string, 10), // Assert as string, then parse
      username: process.env.DB_USERNAME as string, // Assert as string
      password: process.env.DB_PASSWORD as string, // Assert as string
      database: process.env.DB_DATABASE as string, // Assert as string
      entities: [Tenant, Employee, OnboardingTask, Document, LeaveRequest, Timesheet, Goal, Review, Announcement, Recognition, User], // Add User here
      synchronize: true,
      logging: ['query', 'error'],
    }),
    EmployeeModule,
    TenantModule,
    LeaveRequestModule,
    TimesheetModule,
    GoalModule,
    ReviewModule,
    AnnouncementModule,
    RecognitionModule,
    DocumentModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}