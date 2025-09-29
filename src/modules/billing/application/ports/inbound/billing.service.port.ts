import { CreateInvoiceCommand, CreateInvoiceResult } from '../../dto/create-invoice.dto';

export interface BillingServicePort {
  createInvoice(command: CreateInvoiceCommand): Promise<CreateInvoiceResult>;
}