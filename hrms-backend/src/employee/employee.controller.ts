import { Controller, Get, Post, Put, Delete, Body, Param, HttpStatus, Res } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { Response } from 'express'; // Import Response for direct status control

// Placeholder for tenantId. In a real app, this would come from authentication.
// For now, you can hardcode a UUID here for testing, or pass it in the request body for POST/PUT.
// We'll replace this with proper authentication later.
const DUMMY_TENANT_ID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef'; // Replace with a real UUID if you want to test data persistence

@Controller('employees') // This prefix will be used for all routes in this controller (e.g., /employees)
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  // POST /employees
  @Post()
  async create(@Body() createEmployeeDto: any, @Res() res: Response) {
    // For now, allow tenantId to be passed in the body for testing creation
    // In real app, tenantId would be extracted from authenticated user.
    const tenantId = createEmployeeDto.tenantId || DUMMY_TENANT_ID; 

    if (!tenantId) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'tenantId is required in the request body or via authentication.' });
    }

    try {
      const employee = await this.employeeService.create(createEmployeeDto, tenantId);
      res.status(HttpStatus.CREATED).json(employee);
    } catch (error) {
      if (error.message.includes('email already exists')) {
        return res.status(HttpStatus.CONFLICT).json({ message: error.message });
      }
      res.status(HttpStatus.BAD_REQUEST).json({ message: 'Failed to create employee', error: error.message });
    }
  }

  // GET /employees
  @Get()
  async findAll(@Res() res: Response) {
    // For now, use the DUMMY_TENANT_ID for fetching all employees
    // In a real app, the tenantId would be extracted from the authenticated user.
    const tenantId = DUMMY_TENANT_ID; 

    try {
      const employees = await this.employeeService.findAll(tenantId);
      res.status(HttpStatus.OK).json(employees);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to retrieve employees', error: error.message });
    }
  }

  // GET /employees/:id
  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    const tenantId = DUMMY_TENANT_ID; 

    try {
      const employee = await this.employeeService.findOne(id, tenantId);
      res.status(HttpStatus.OK).json(employee);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to retrieve employee', error: error.message });
    }
  }

  // PUT /employees/:id
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateEmployeeDto: any, @Res() res: Response) {
    const tenantId = updateEmployeeDto.tenantId || DUMMY_TENANT_ID; 
    if (!tenantId) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'tenantId is required in the request body or via authentication.' });
    }

    try {
      const employee = await this.employeeService.update(id, updateEmployeeDto, tenantId);
      res.status(HttpStatus.OK).json(employee);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      if (error.message.includes('email already exists')) {
        return res.status(HttpStatus.CONFLICT).json({ message: error.message });
      }
      res.status(HttpStatus.BAD_REQUEST).json({ message: 'Failed to update employee', error: error.message });
    }
  }

  // DELETE /employees/:id
  @Delete(':id')
  async remove(@Param('id') id: string, @Body('tenantId') tenantId: string, @Res() res: Response) {
    // For DELETE, tenantId needs to be provided in the request body for simplicity now
    // In real app, tenantId from auth.
    if (!tenantId) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'tenantId is required in the request body.' });
    }

    try {
      await this.employeeService.remove(id, tenantId);
      res.status(HttpStatus.NO_CONTENT).send(); // 204 No Content for successful deletion
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to delete employee', error: error.message });
    }
  }
}