import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@UseGuards(JwtAuthGuard)
@Controller('employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  create(@Req() req: Request, @Body() createEmployeeDto: CreateEmployeeDto) {
    const tenantId = req.user.tenantId;
    return this.employeeService.create(createEmployeeDto, tenantId);
  }

  @Get()
  findAll(@Req() req: Request) {
    const tenantId = req.user.tenantId;
    return this.employeeService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.employeeService.findOne(id, tenantId);
  }

  @Put(':id')
  update(@Req() req: Request, @Param('id') id: string, @Body() updateEmployeeDto: UpdateEmployeeDto) {
    const tenantId = req.user.tenantId;
    return this.employeeService.update(id, updateEmployeeDto, tenantId);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.employeeService.remove(id, tenantId);
  }
}