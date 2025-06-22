import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend communication
  app.enableCors({
    origin: 'http://localhost:3001', // <--- IMPORTANT: Replace with the actual port your React frontend is running on (e.g., 3000, 3001, 3002)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // Allow cookies to be sent
  });

  // You can also adjust the port the backend runs on if there's a conflict
  const PORT = process.env.BACKEND_PORT || 3000; // Use an environment variable or default to 3000
  await app.listen(PORT);
  console.log(`Backend Application is running on: http://localhost:${PORT}`);
}
bootstrap();