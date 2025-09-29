import { Module } from '@nestjs/common';
import { TaxCalculationService } from './domain/services/tax-calculation.service';
import { AccessKeyGeneratorService } from './domain/services/access-key-generator.service';
import { SriXmlGeneratorService } from './infrastructure/xml/sri-xml-generator.service';
import { CreateInvoiceUseCase } from './application/use-cases/create-invoice.use-case';
import { BillingController } from './infrastructure/controllers/billing.controller';
import { DigitalSignatureModule } from '../digital-signature/digital-signature.module';
import { SriIntegrationModule } from '../sri-integration/sri-integration.module';

// Ports
import { SriGatewayPort } from './application/ports/outbound/sri-gateway.port';
import { DigitalSignerPort } from './application/ports/outbound/digital-signer.port';
import { XmlGeneratorPort } from './application/ports/outbound/xml-generator.port';
import { InvoiceRepositoryPort } from './application/ports/outbound/invoice-repository.port';

// Adapters
import { SriSoapAdapter } from './infrastructure/adapters/sri-soap.adapter';
import { DigitalSignerAdapter } from './infrastructure/adapters/digital-signer.adapter';
import { XmlGeneratorAdapter } from './infrastructure/adapters/xml-generator.adapter';
import { InvoiceMemoryRepository } from './infrastructure/repositories/invoice-memory.repository';

@Module({
  imports: [DigitalSignatureModule, SriIntegrationModule],
  providers: [
    // Domain Services
    TaxCalculationService,
    AccessKeyGeneratorService,

    // Infrastructure Services
    SriXmlGeneratorService,

    // Adapters (implementing ports)
    {
      provide: 'SRI_GATEWAY_PORT',
      useClass: SriSoapAdapter,
    },
    {
      provide: 'DIGITAL_SIGNER_PORT',
      useClass: DigitalSignerAdapter,
    },
    {
      provide: 'XML_GENERATOR_PORT',
      useClass: XmlGeneratorAdapter,
    },
    {
      provide: 'INVOICE_REPOSITORY_PORT',
      useClass: InvoiceMemoryRepository,
    },

    // Use Cases
    CreateInvoiceUseCase,
  ],
  controllers: [BillingController],
  exports: [CreateInvoiceUseCase],
})
export class BillingModule { }