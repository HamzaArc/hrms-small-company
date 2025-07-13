import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private tenantsRepository: Repository<Tenant>,
  ) {}

  async create(tenantData: Partial<Tenant>): Promise<Tenant> {
    const existingTenant = await this.tenantsRepository.findOne({ where: { name: tenantData.name } });
    if (existingTenant) {
      throw new BadRequestException('A tenant with this name already exists.');
    }
    const newTenant = this.tenantsRepository.create(tenantData);
    return this.tenantsRepository.save(newTenant);
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantsRepository.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID "${id}" not found.`);
    }
    return tenant;
  }

  async update(id: string, updateData: Partial<Tenant>): Promise<Tenant> {
    const tenant = await this.findOne(id); // Reuse findOne to check existence
    // Ensure that the name cannot be changed if it's provided in updateData and already exists
    if (updateData.name && updateData.name !== tenant.name) {
      const existingTenantWithName = await this.tenantsRepository.findOne({ where: { name: updateData.name } });
      if (existingTenantWithName && existingTenantWithName.id !== id) {
        throw new BadRequestException('A tenant with this name already exists.');
      }
    }
    this.tenantsRepository.merge(tenant, updateData);
    return this.tenantsRepository.save(tenant);
  }

  // Optional: Add a remove method if needed for full CRUD on tenants
  async remove(id: string): Promise<void> {
    const result = await this.tenantsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Tenant with ID "${id}" not found.`);
    }
  }
}