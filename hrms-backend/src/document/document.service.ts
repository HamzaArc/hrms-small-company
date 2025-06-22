import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './document.entity';
import { EmployeeService } from '../employee/employee.service'; // To validate employee existence

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
    private employeeService: EmployeeService, // Inject EmployeeService
  ) {}

  // CREATE Document Metadata (and handle file info)
  async create(documentData: Partial<Document>, tenantId: string, file?: Express.Multer.File): Promise<Document> {
    // Validate employee exists for this tenant
    await this.employeeService.findOne(documentData.employeeId as string, tenantId);

    if (!documentData.name || !documentData.type || !documentData.uploadDate) {
      throw new BadRequestException('Name, type, and uploadDate are required fields.');
    }

    // Validate dates (if provided)
    const uploadDate = new Date(documentData.uploadDate!);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (uploadDate > today) {
        throw new BadRequestException('Upload date cannot be in the future.');
    }

    if (documentData.expiryDate) {
      const expiryDate = new Date(documentData.expiryDate!);
      if (expiryDate <= uploadDate) {
        throw new BadRequestException('Expiry date must be after upload date.');
      }
    }

    // Handle file metadata (placeholder for actual file upload to cloud storage)
    let fileUrl: string | undefined;
    if (file) {
        // In a real application, you would upload 'file' to AWS S3/Azure Blob/Google Cloud Storage here.
        // For now, we'll just simulate a URL.
        fileUrl = `http://your-cloud-storage.com/files/<span class="math-inline">\{tenantId\}/</span>{file.originalname}`;
        // You might also store file.filename, file.mimetype, file.size in the DB if needed.
    } else if (documentData.fileUrl) { // Allow passing a fileUrl directly if not uploading binary
        fileUrl = documentData.fileUrl;
    }


    const newDocument = this.documentsRepository.create({
      ...documentData,
      tenantId,
      fileUrl, // Store the generated or provided file URL
      status: documentData.status || 'Active', // Default status if not provided
      uploadDate: uploadDate, // Use the validated date object
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
      relations: ['employee'], // Load employee data
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

    // Validate dates if provided
    if (documentData.uploadDate !== undefined) {
        const uploadDate = new Date(documentData.uploadDate!);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (uploadDate > today) {
            throw new BadRequestException('Upload date cannot be in the future.');
        }
    }
    if (documentData.expiryDate !== undefined) {
        const expiryDate = new Date(documentData.expiryDate!);
        const uploadDate = new Date(documentData.uploadDate || document.uploadDate); // Use new upload date if provided, else existing
        if (expiryDate <= uploadDate) {
            throw new BadRequestException('Expiry date must be after upload date.');
        }
    }

    // If a new file is uploaded for an update, the controller will pass it to `create` or a separate upload method.
    // This update method handles metadata changes only.

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

    // In a real application, you would also delete the actual file from cloud storage here
    // using document.fileUrl or document.fileKey.
    console.log(`(Simulating file deletion from cloud storage for: ${document.fileUrl})`);

    const result = await this.documentsRepository.delete({ id: id, tenantId: tenantId });
    if (result.affected === 0) {
      throw new NotFoundException(`Document with ID "${id}" not found for this tenant.`);
    }
  }
}