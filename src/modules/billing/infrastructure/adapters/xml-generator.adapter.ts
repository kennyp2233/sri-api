import { Injectable } from '@nestjs/common';
import { XmlGeneratorPort } from '../../application/ports/outbound/xml-generator.port';
import { SriXmlGeneratorService } from '../xml/sri-xml-generator.service';
import { Invoice } from '../../domain/entities/invoice.entity';

@Injectable()
export class XmlGeneratorAdapter implements XmlGeneratorPort {
  constructor(private readonly xmlGenerator: SriXmlGeneratorService) {}

  generateInvoiceXml(invoice: Invoice): string {
    return this.xmlGenerator.generateInvoiceXml(invoice);
  }
}