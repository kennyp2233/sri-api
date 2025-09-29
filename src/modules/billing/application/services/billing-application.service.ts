import { Injectable, Inject } from '@nestjs/common';
import { BillingServicePort } from '../ports/inbound/billing.service.port';
import { SriGatewayPort } from '../ports/outbound/sri-gateway.port';
import { DigitalSignerPort } from '../ports/outbound/digital-signer.port';
import { XmlGeneratorPort } from '../ports/outbound/xml-generator.port';
import { InvoiceRepositoryPort } from '../ports/outbound/invoice-repository.port';
import { CreateInvoiceCommand, CreateInvoiceResult } from '../dto/create-invoice.dto';

@Injectable()
export class BillingApplicationService implements BillingServicePort {
  constructor(
    @Inject('SRI_GATEWAY_PORT')
    private readonly sriGateway: SriGatewayPort,
    @Inject('DIGITAL_SIGNER_PORT')
    private readonly digitalSigner: DigitalSignerPort,
    @Inject('XML_GENERATOR_PORT')
    private readonly xmlGenerator: XmlGeneratorPort,
    @Inject('INVOICE_REPOSITORY_PORT')
    private readonly invoiceRepository: InvoiceRepositoryPort,
  ) {}

  async createInvoice(command: CreateInvoiceCommand): Promise<CreateInvoiceResult> {
    // This will be implemented when we refactor the use case
    throw new Error('Method not implemented');
  }
}