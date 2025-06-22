import { Controller, Post, Body, HttpStatus, Res, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UserService } from '../user/user.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    ) {}
  
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req, @Res() res: Response) {
    try {
        const userProfile = await this.userService.findByIdWithTenant(req.user.id);
        delete userProfile.password;
        res.status(HttpStatus.OK).json(userProfile);
    } catch (error) {
        res.status(HttpStatus.NOT_FOUND).json({ message: 'User profile not found.' });
    }
  }

  @Post('setup-tenant-admin')
  async setupTenantAdmin(@Body() setupDto: any, @Res() res: Response) {
    if (!setupDto.tenantName || !setupDto.adminEmail || !setupDto.adminPassword) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Tenant name, admin email, and admin password are required.' });
    }
    try {
      const result = await this.authService.createInitialTenantAndAdmin(setupDto.tenantName, setupDto.adminEmail, setupDto.adminPassword);
      res.status(HttpStatus.CREATED).json({ message: 'Tenant and admin user created successfully.', ...result });
    } catch (error) {
      res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
    }
  }

  @Post('login')
  async login(@Body() loginDto: any, @Res() res: Response) {
    if (!loginDto.email || !loginDto.password) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Email and password are required.' });
    }
    try {
      const result = await this.authService.login(loginDto.email, loginDto.password);
      res.status(HttpStatus.OK).json({ message: 'Login successful.', ...result });
    } catch (error) {
      res.status(HttpStatus.UNAUTHORIZED).json({ message: error.message });
    }
  }
}