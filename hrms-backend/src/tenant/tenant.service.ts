import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'; // ADD NotFoundException here
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
      // Throw NotFoundException if the tenant is not found
      throw new NotFoundException(`Tenant with ID "${id}" not found.`);
    }
    return tenant;
  }

  // You can add other methods like findAll, update, remove as needed for Tenant management
  // For instance:
  /*
  async findAll(): Promise<Tenant[]> {
    return this.tenantsRepository.find();
  }

  async update(id: string, updateData: Partial<Tenant>): Promise<Tenant> {
    const tenant = await this.findOne(id); // Reuse findOne to check existence
    this.tenantsRepository.merge(tenant, updateData);
    return this.tenantsRepository.save(tenant);
  }

  async remove(id: string): Promise<void> {
    const result = await this.tenantsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Tenant with ID "${id}" not found.`);
    }
  }
  */
}