import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // <-- IMPORT THE VALIDATION PIPE

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend communication
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // FIX: Enable global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strips away properties that are not in the DTO
    forbidNonWhitelisted: true, // Throws an error if unknown properties are sent
    transform: true, // Automatically transforms payloads to be instances of the DTO class
  }));


  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Backend Application is running on: ${await app.getUrl()}`);
}
bootstrap();