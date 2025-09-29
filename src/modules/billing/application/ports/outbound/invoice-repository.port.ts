import { Invoice } from '../../../domain/entities/invoice.entity';

export interface InvoiceRepositoryPort {
  save(invoice: Invoice): Promise<void>;
  findById(id: string): Promise<Invoice | null>;
  findByAccessKey(accessKey: string): Promise<Invoice | null>;
  findAll(): Promise<Invoice[]>;
}