import { Injectable } from '@nestjs/common';
import { InvoiceRepositoryPort } from '../../application/ports/outbound/invoice-repository.port';
import { Invoice } from '../../domain/entities/invoice.entity';

@Injectable()
export class InvoiceMemoryRepository implements InvoiceRepositoryPort {
  private readonly invoices = new Map<string, Invoice>();

  async save(invoice: Invoice): Promise<void> {
    this.invoices.set(invoice.id, invoice);
  }

  async findById(id: string): Promise<Invoice | null> {
    return this.invoices.get(id) || null;
  }

  async findByAccessKey(accessKey: string): Promise<Invoice | null> {
    for (const invoice of this.invoices.values()) {
      if (invoice.accessKey === accessKey) {
        return invoice;
      }
    }
    return null;
  }

  async findAll(): Promise<Invoice[]> {
    return Array.from(this.invoices.values());
  }
}