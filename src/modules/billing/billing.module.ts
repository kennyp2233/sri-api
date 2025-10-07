import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SriXmlGeneratorService } from './infrastructure/xml/sri-xml-generator.service';
import { InvoiceController } from './infrastructure/controllers/invoice.controller';
import { DigitalSignatureModule } from '../digital-signature/digital-signature.module';
import { SriIntegrationModule } from '../sri-integration/sri-integration.module';

@Module({
  imports: [
    ConfigModule,
    DigitalSignatureModule,
    SriIntegrationModule,
  ],
  providers: [
    // Infrastructure Services
    SriXmlGeneratorService,
  ],
  controllers: [InvoiceController],
  exports: [SriXmlGeneratorService],
})
export class BillingModule {}