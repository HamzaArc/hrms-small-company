import { Controller, Post, Body, HttpStatus, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';

@Controller('auth') // API endpoint prefix for authentication
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/setup-tenant-admin - Special endpoint for initial tenant and admin creation
  // This should be protected in production, but for first setup, it's open.
  @Post('setup-tenant-admin')
  async setupTenantAdmin(@Body() setupDto: any, @Res() res: Response) {
    if (!setupDto.tenantName || !setupDto.adminEmail || !setupDto.adminPassword) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Tenant name, admin email, and admin password are required.' });
    }
    try {
      const result = await this.authService.createInitialTenantAndAdmin(setupDto.tenantName, setupDto.adminEmail, setupDto.adminPassword);
      res.status(HttpStatus.CREATED).json({ message: 'Tenant and admin user created successfully.', tenant: result.tenant, user: result.user, accessToken: result.accessToken });
    } catch (error) {
      if (error.message.includes('already exists')) {
        return res.status(HttpStatus.CONFLICT).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to set up tenant and admin user', error: error.message });
    }
  }

  // POST /auth/register - Register a new user for an existing tenant
  @Post('register')
  async register(@Body() registerDto: any, @Res() res: Response) {
    if (!registerDto.tenantId || !registerDto.email || !registerDto.password) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Tenant ID, email, and password are required.' });
    }
    try {
      const user = await this.authService.register(registerDto, registerDto.tenantId);
      res.status(HttpStatus.CREATED).json({ message: 'User registered successfully.', user });
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('Employee with ID') || error.message.includes('Tenant with ID')) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to register user', error: error.message });
    }
  }

  // POST /auth/login - User login
  @Post('login')
  async login(@Body() loginDto: any, @Res() res: Response) {
    if (!loginDto.email || !loginDto.password || !loginDto.tenantId) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Email, password, and tenant ID are required.' });
    }
    try {
      const { accessToken, user } = await this.authService.login(loginDto.email, loginDto.password, loginDto.tenantId);
      res.status(HttpStatus.OK).json({ message: 'Login successful.', accessToken, user });
    } catch (error) {
      if (error.message.includes('Invalid credentials')) {
        return res.status(HttpStatus.UNAUTHORIZED).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Login failed', error: error.message });
    }
  }
}