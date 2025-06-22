import { Injectable, BadRequestException } from '@nestjs/common';
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
}