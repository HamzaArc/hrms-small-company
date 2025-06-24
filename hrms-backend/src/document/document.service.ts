import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm'; // Import IsNull if you filter for nulls
import { Document } from './document.entity';
import { EmployeeService } from '../employee/employee.service';

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
    private employeeService: EmployeeService,
  ) {}

  // CREATE Document Metadata (and handle file info)
  async create(documentData: Partial<Document>, tenantId: string, file?: Express.Multer.File): Promise<Document> {
    // Validate employee exists for this tenant
    await this.employeeService.findOne(documentData.employeeId as string, tenantId);

    if (!documentData.name || !documentData.type) { // Removed uploadDate from here
      throw new BadRequestException('Name and type are required fields.');
    }

    // FIX: Always set uploadDate to current server date for new creations if not explicitly provided
    const actualUploadDate = new Date();
    actualUploadDate.setUTCHours(0,0,0,0); // Normalize to midnight UTC for consistent comparison

    // Validate expiryDate if provided (must be after actualUploadDate)
    if (documentData.expiryDate) {
      const expiryDate = new Date(documentData.expiryDate);
      expiryDate.setUTCHours(0,0,0,0); // Normalize expiry date to midnight UTC as well

      if (expiryDate <= actualUploadDate) {
        throw new BadRequestException('Expiry date must be after the upload date.');
      }
    }

    // Handle file metadata (placeholder for actual file upload to cloud storage)
    let fileUrl: string | undefined;
    if (file) {
        fileUrl = `http://your-cloud-storage.com/files/${tenantId}/${file.originalname}`;
    } else if (documentData.fileUrl) {
        fileUrl = documentData.fileUrl;
    }


    const newDocument = this.documentsRepository.create({
      ...documentData,
      tenantId,
      fileUrl,
      status: documentData.status || 'Active',
      uploadDate: actualUploadDate, // FIX: Use the consistently generated actualUploadDate
    });
    return this.documentsRepository.save(newDocument);
  }

  // READ All Documents for a Tenant (with optional employee/type/status filters)
  async findAll(tenantId: string, employeeId?: string, type?: string, status?: string): Promise<Document[]> {
    const whereClause: any = { tenantId: tenantId };
    if (employeeId) {
      whereClause.employeeId = employeeId;
    }
    if (type) {
      whereClause.type = type;
    }
    if (status) {
      whereClause.status = status;
    }

    return this.documentsRepository.find({
      where: whereClause,
      relations: ['employee'],
      order: { uploadDate: 'DESC', createdAt: 'DESC' },
    });
  }

  // READ One Document by ID for a Tenant
  async findOne(id: string, tenantId: string): Promise<Document> {
    const document = await this.documentsRepository.findOne({
      where: { id: id, tenantId: tenantId },
      relations: ['employee'],
    });
    if (!document) {
      throw new NotFoundException(`Document with ID "${id}" not found for this tenant.`);
    }
    return document;
  }

  // UPDATE Document
  async update(id: string, documentData: Partial<Document>, tenantId: string): Promise<Document> {
    const document = await this.documentsRepository.findOne({
      where: { id: id, tenantId: tenantId },
    });
    if (!document) {
      throw new NotFoundException(`Document with ID "${id}" not found for this tenant.`);
    }

    // Validate dates if provided in update (only expiryDate is typically updated)
    if (documentData.expiryDate !== undefined) {
        const expiryDate = new Date(documentData.expiryDate!);
        expiryDate.setUTCHours(0,0,0,0); // Normalize expiry date to midnight UTC

        // Compare against existing upload date if new uploadDate is not provided
        const compareUploadDate = new Date(documentData.uploadDate || document.uploadDate);
        compareUploadDate.setUTCHours(0,0,0,0);

        if (expiryDate <= compareUploadDate) {
            throw new BadRequestException('Expiry date must be after upload date.');
        }
    }
    // uploadDate should generally not be updated after creation, so no specific validation here.
    // If it was meant to be updateable, it would require careful handling to preserve original upload date
    // or validate it against `today`.

    this.documentsRepository.merge(document, documentData);
    return this.documentsRepository.save(document);
  }

  // DELETE Document (and associated file from storage)
  async remove(id: string, tenantId: string): Promise<void> {
    const document = await this.documentsRepository.findOne({
        where: { id: id, tenantId: tenantId },
    });
    if (!document) {
      throw new NotFoundException(`Document with ID "${id}" not found for this tenant.`);
    }

    console.log(`(Simulating file deletion from cloud storage for: ${document.fileUrl})`);

    const result = await this.documentsRepository.delete({ id: id, tenantId: tenantId });
    if (result.affected === 0) {
      throw new NotFoundException(`Document with ID "${id}" not found for this tenant.`);
    }
  }
}