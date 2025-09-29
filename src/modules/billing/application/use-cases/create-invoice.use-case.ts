import { Injectable, Inject, Logger } from '@nestjs/common';
import { SriGatewayPort } from '../ports/outbound/sri-gateway.port';
import { DigitalSignerPort } from '../ports/outbound/digital-signer.port';
import { XmlGeneratorPort } from '../ports/outbound/xml-generator.port';
import { InvoiceRepositoryPort } from '../ports/outbound/invoice-repository.port';
import { CreateInvoiceCommand, CreateInvoiceResult } from '../dto/create-invoice.dto';
import { Invoice, InvoiceItem } from '../../domain/entities/invoice.entity';
import { TaxCalculationService } from '../../domain/services/tax-calculation.service';

@Injectable()
export class CreateInvoiceUseCase {
  private readonly logger = new Logger(CreateInvoiceUseCase.name);

  constructor(
    @Inject('SRI_GATEWAY_PORT')
    private readonly sriGateway: SriGatewayPort,
    @Inject('DIGITAL_SIGNER_PORT')
    private readonly digitalSigner: DigitalSignerPort,
    @Inject('XML_GENERATOR_PORT')
    private readonly xmlGenerator: XmlGeneratorPort,
    @Inject('INVOICE_REPOSITORY_PORT')
    private readonly invoiceRepository: InvoiceRepositoryPort,
    private readonly taxCalculation: TaxCalculationService,
  ) {}

  async execute(command: CreateInvoiceCommand): Promise<CreateInvoiceResult> {
    try {
      this.logger.log('Iniciando creación de factura');

      // Crear items de factura
      const invoiceItems = command.items.map(item => {
        const precioTotalSinImpuesto = item.cantidad * (item.precioUnitario - (item.descuento || 0));

        return new InvoiceItem(
          item.codigoPrincipal,
          item.descripcion,
          item.cantidad,
          item.precioUnitario,
          item.descuento || 0,
          precioTotalSinImpuesto,
          [{
            codigo: '2', // IVA
            codigoPorcentaje: item.codigoPorcentajeIVA || '2', // 12% por defecto
            tarifa: 12.00,
            baseImponible: precioTotalSinImpuesto,
            valor: precioTotalSinImpuesto * 0.12,
          }],
        );
      });

      // Calcular totales
      const { totalSinImpuestos, totalConImpuestos, importeTotal } = this.taxCalculation.calculateTotalTaxes(invoiceItems);

      // Crear factura
      const invoice = new Invoice(
        `inv-${Date.now()}`,
        command.ruc,
        command.razonSocial,
        new Date(),
        command.ambiente || '1',
        '1', // Tipo emisión normal
        command.establecimiento || '001',
        command.puntoEmision || '001',
        command.secuencial || '000000001',
        invoiceItems,
        totalSinImpuestos,
        0, // Sin descuento general
        totalConImpuestos,
        importeTotal,
      );

      // Generar XML usando el puerto
      const xml = this.xmlGenerator.generateInvoiceXml(invoice);
      this.logger.log('XML generado exitosamente');

      // Firmar XML usando el puerto
      const signatureResult = await this.digitalSigner.signXml(xml);
      this.logger.log('XML firmado exitosamente');

      // Enviar a SRI usando el puerto
      const sriResponse = await this.sriGateway.sendInvoice(signatureResult.signedXml);
      this.logger.log('Factura enviada a SRI exitosamente');

      // Guardar factura en el repositorio
      await this.invoiceRepository.save(invoice);

      return {
        invoice,
        xml,
        signedXml: signatureResult.signedXml,
        sriResponse,
      };
    } catch (error) {
      this.logger.error(`Error creando factura: ${error.message}`);
      throw error;
    }
  }
}