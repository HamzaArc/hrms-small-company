// hrms-backend/src/employee/employee.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Res, HttpStatus } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request, Response } from 'express';
import { CreateEmployeeDto } from './dto/create-employee.dto'; // FIX: Ensure this import is correct
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@UseGuards(JwtAuthGuard)
@Controller('employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  async create(@Req() req: Request, @Res() res: Response, @Body() createEmployeeDto: CreateEmployeeDto) {
    const tenantId = req.user.tenantId;
    try {
      const employee = await this.employeeService.create(createEmployeeDto, tenantId);
      res.status(HttpStatus.CREATED).json(employee);
    } catch (error) {
      if (error.message.includes('exists')) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message || 'Failed to create employee' });
    }
  }

  @Get()
  async findAll(@Req() req: Request, @Res() res: Response) {
    const tenantId = req.user.tenantId;
    try {
      const employees = await this.employeeService.findAll(tenantId);
      res.status(HttpStatus.OK).json(employees);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message || 'Failed to retrieve employees' });
    }
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Res() res: Response, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    try {
      const employee = await this.employeeService.findOne(id, tenantId);
      res.status(HttpStatus.OK).json(employee);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message || 'Failed to retrieve employee' });
    }
  }

  @Put(':id')
  async update(@Req() req: Request, @Res() res: Response, @Param('id') id: string, @Body() updateEmployeeDto: UpdateEmployeeDto) {
    const tenantId = req.user.tenantId;
    try {
      const updatedEmployee = await this.employeeService.update(id, updateEmployeeDto, tenantId);
      res.status(HttpStatus.OK).json(updatedEmployee);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message || 'Failed to update employee' });
    }
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Res() res: Response, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    try {
      await this.employeeService.remove(id, tenantId);
      res.status(HttpStatus.NO_CONTENT).send();
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to delete employee', error: error.message });
    }
  }
}