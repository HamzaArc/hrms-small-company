// hrms-backend/src/tenant/tenant.controller.ts
import { Controller, Get, Put, Body, Param, UseGuards, Req, Res, HttpStatus } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request, Response } from 'express';
import { IsString, IsOptional, IsEmail } from 'class-validator'; // NEW: Import validation decorators

// DTO for updating tenant
class UpdateTenantDto {
  @IsOptional() // NEW: Mark as optional for PUT requests
  @IsString() // NEW: Ensure it's a string
  name?: string;

  @IsOptional() // NEW: Mark as optional for PUT requests
  @IsEmail() // NEW: Validate as email
  contactEmail?: string;

  @IsOptional() // NEW: Mark as optional for PUT requests
  @IsString() // NEW: Ensure it's a string
  status?: string; // Consider adding @IsIn(['active', 'inactive']) for stricter status validation
}

@UseGuards(JwtAuthGuard)
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get(':id')
  async findOne(@Req() req: Request, @Res() res: Response, @Param('id') id: string) {
    // Ensure the user can only fetch their own tenant data
    if (req.user.tenantId !== id && req.user.role !== 'admin') {
      return res.status(HttpStatus.FORBIDDEN).json({ message: 'Forbidden: You can only access your own tenant data.' });
    }
    try {
      const tenant = await this.tenantService.findOne(id);
      res.status(HttpStatus.OK).json(tenant);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to retrieve tenant', error: error.message });
    }
  }

  @Put(':id')
  async update(@Req() req: Request, @Res() res: Response, @Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    // Only admins can update tenant data, and only their own tenant
    if (req.user.role !== 'admin' || req.user.tenantId !== id) {
      return res.status(HttpStatus.FORBIDDEN).json({ message: 'Forbidden: Only administrators can update their own tenant information.' });
    }
    try {
      const updatedTenant = await this.tenantService.update(id, updateTenantDto);
      res.status(HttpStatus.OK).json(updatedTenant);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      // Catch the specific BadRequestException from the service if a tenant with that name exists
      if (error.message.includes('exists')) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to update tenant', error: error.message });
    }
  }
}