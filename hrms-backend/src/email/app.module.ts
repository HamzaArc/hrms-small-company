import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Tenant } from '../tenant/tenant.entity';
import { Employee } from '../employee/employee.entity';
import { OnboardingTask } from '../onboarding-task/onboarding-task.entity';
import { Document } from '../document/document.entity';
import { EmployeeModule } from '../employee/employee.module';
import { TenantModule } from '../tenant/tenant.module';
import { LeaveRequest } from '../leave-request/leave-request.entity';
import { LeaveRequestModule } from '../leave-request/leave-request.module';
import { Timesheet } from '../timesheet/timesheet.entity';
import { TimesheetModule } from '../timesheet/timesheet.module';
import { Goal } from '../goal/goal.entity';
import { GoalModule } from '../goal/goal.module';
import { Review } from '../review/review.entity';
import { ReviewModule } from '../review/review.module';
import { Announcement } from '../announcement/announcement.entity';
import { AnnouncementModule } from '../announcement/announcement.module';
import { Recognition } from '../recognition/recognition.entity';
import { RecognitionModule } from '../recognition/recognition.module';
import { DocumentModule } from '../document/document.module';
import { User } from '../user/user.entity';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { OnboardingTaskModule } from '../onboarding-task/onboarding-task.module';
import { EmailModule } from '../email/email.module'; // NEW: Import EmailModule

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST as string,
      port: parseInt(process.env.DB_PORT as string, 10),
      username: process.env.DB_USERNAME as string,
      password: process.env.DB_PASSWORD as string,
      database: process.env.DB_DATABASE as string,
      entities: [Tenant, Employee, OnboardingTask, Document, LeaveRequest, Timesheet, Goal, Review, Announcement, Recognition, User],
      synchronize: true,
      logging: ['query', 'error'],
    }),
    AuthModule,
    UserModule,
    TenantModule,
    EmployeeModule,
    LeaveRequestModule,
    TimesheetModule,
    GoalModule,
    ReviewModule,
    AnnouncementModule,
    RecognitionModule,
    DocumentModule,
    OnboardingTaskModule,
    EmailModule, // NEW: Add EmailModule here
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}