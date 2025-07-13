// hrms-backend/src/leave-policy/leave-policy.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeavePolicy } from './leave-policy.entity';

@Injectable()
export class LeavePolicyService {
  constructor(
    @InjectRepository(LeavePolicy)
    private leavePoliciesRepository: Repository<LeavePolicy>,
  ) {}

  // CREATE LeavePolicy
  async create(leavePolicyData: Partial<LeavePolicy>, tenantId: string): Promise<LeavePolicy> {
    if (!leavePolicyData.name || !leavePolicyData.description || leavePolicyData.accrualRate === undefined) {
      throw new BadRequestException('Policy name, description, and accrual rate are required.');
    }

    // Check for duplicate policy names within the same tenant
    const existingPolicy = await this.leavePoliciesRepository.findOne({
      where: { name: leavePolicyData.name, tenantId: tenantId },
    });
    if (existingPolicy) {
      throw new BadRequestException(`Leave policy with name "${leavePolicyData.name}" already exists for this tenant.`);
    }

    const newPolicy = this.leavePoliciesRepository.create({
      ...leavePolicyData,
      tenantId,
      accrualUnit: leavePolicyData.accrualUnit || 'month',
      isPaid: leavePolicyData.isPaid ?? true,
      applicableRoles: leavePolicyData.applicableRoles || [],
    });
    return this.leavePoliciesRepository.save(newPolicy);
  }

  // READ All LeavePolicies for a Tenant
  async findAll(tenantId: string): Promise<LeavePolicy[]> {
    return this.leavePoliciesRepository.find({
      where: { tenantId: tenantId },
      order: { name: 'ASC' },
    });
  }

  // READ One LeavePolicy by ID for a Tenant
  async findOne(id: string, tenantId: string): Promise<LeavePolicy> {
    const policy = await this.leavePoliciesRepository.findOne({
      where: { id: id, tenantId: tenantId },
    });
    if (!policy) {
      throw new NotFoundException(`Leave policy with ID "${id}" not found for this tenant.`);
    }
    return policy;
  }

  // UPDATE LeavePolicy
  async update(id: string, updateData: Partial<LeavePolicy>, tenantId: string): Promise<LeavePolicy> {
    const policy = await this.leavePoliciesRepository.findOne({
      where: { id: id, tenantId: tenantId },
    });
    if (!policy) {
      throw new NotFoundException(`Leave policy with ID "${id}" not found for this tenant.`);
    }

    // Check for duplicate policy name if name is being updated
    if (updateData.name && updateData.name !== policy.name) {
      const existingPolicyWithName = await this.leavePoliciesRepository.findOne({
        where: { name: updateData.name, tenantId: tenantId },
      });
      if (existingPolicyWithName && existingPolicyWithName.id !== id) {
        throw new BadRequestException(`Leave policy with name "${updateData.name}" already exists for this tenant.`);
      }
    }

    this.leavePoliciesRepository.merge(policy, updateData);
    return this.leavePoliciesRepository.save(policy);
  }

  // DELETE LeavePolicy
  async remove(id: string, tenantId: string): Promise<void> {
    const result = await this.leavePoliciesRepository.delete({ id: id, tenantId: tenantId });
    if (result.affected === 0) {
      throw new NotFoundException(`Leave policy with ID "${id}" not found for this tenant.`);
    }
  }
}