import { Invoice } from '../../../domain/entities/invoice.entity';

export interface XmlGeneratorPort {
  generateInvoiceXml(invoice: Invoice): string;
}