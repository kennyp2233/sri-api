import { Injectable, Logger } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { XMLParser } from 'fast-xml-parser';

interface InvoiceData {
  razonSocialEmisor: string;
  nombreComercial: string;
  rucEmisor: string;
  direccionEmisor: string;
  claveAcceso: string;
  numeroAutorizacion: string;
  fechaAutorizacion: string;
  ambiente: string;
  tipoEmision: string;
  razonSocialComprador: string;
  identificacionComprador: string;
  fechaEmision: string;
  numeroComprobante: string;
  subtotal: number;
  iva: number;
  total: number;
  items: Array<{
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }>;
}

@Injectable()
export class RideGeneratorService {
  private readonly logger = new Logger(RideGeneratorService.name);
  private readonly xmlParser: XMLParser;

  constructor() {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
  }

  /**
   * Generate RIDE (PDF) from authorized XML
   */
  async generateRide(
    authorizedXml: string,
    numeroAutorizacion: string,
    fechaAutorizacion: string,
    ambiente: string,
  ): Promise<Buffer> {
    this.logger.log('Generating RIDE from authorized XML');

    try {
      // Parse XML
      const invoiceData = this.parseInvoiceXml(authorizedXml);

      // Add authorization data
      invoiceData.numeroAutorizacion = numeroAutorizacion;
      invoiceData.fechaAutorizacion = fechaAutorizacion;
      invoiceData.ambiente = ambiente;

      // Generate PDF
      return await this.createPDF(invoiceData);
    } catch (error) {
      this.logger.error(`Error generating RIDE: ${error.message}`);
      throw new Error(`Failed to generate RIDE: ${error.message}`);
    }
  }

  /**
   * Parse invoice XML to extract data
   */
  private parseInvoiceXml(xml: string): InvoiceData {
    const parsed = this.xmlParser.parse(xml);
    const factura = parsed.factura || parsed.autorizacion?.comprobante?.factura;

    if (!factura) {
      throw new Error('Invalid invoice XML structure');
    }

    const infoTributaria = factura.infoTributaria;
    const infoFactura = factura.infoFactura;
    const detalles = factura.detalles?.detalle || [];

    // Calculate totals
    const items = Array.isArray(detalles) ? detalles : [detalles];
    const subtotal = items.reduce(
      (sum, item) => sum + parseFloat(item.precioTotalSinImpuesto || 0),
      0,
    );

    const totalImpuestos = infoFactura.totalConImpuestos?.totalImpuesto || [];
    const iva = Array.isArray(totalImpuestos)
      ? totalImpuestos.reduce((sum, imp) => sum + parseFloat(imp.valor || 0), 0)
      : parseFloat(totalImpuestos.valor || 0);

    return {
      razonSocialEmisor: infoTributaria.razonSocial,
      nombreComercial: infoTributaria.nombreComercial || infoTributaria.razonSocial,
      rucEmisor: infoTributaria.ruc,
      direccionEmisor: infoTributaria.dirMatriz,
      claveAcceso: infoTributaria.claveAcceso,
      numeroAutorizacion: '',
      fechaAutorizacion: '',
      ambiente: infoTributaria.ambiente === '1' ? 'PRUEBAS' : 'PRODUCCIÓN',
      tipoEmision: infoTributaria.tipoEmision === '1' ? 'NORMAL' : 'CONTINGENCIA',
      razonSocialComprador: infoFactura.razonSocialComprador,
      identificacionComprador: infoFactura.identificacionComprador,
      fechaEmision: infoFactura.fechaEmision,
      numeroComprobante: `${infoTributaria.estab}-${infoTributaria.ptoEmi}-${infoTributaria.secuencial}`,
      subtotal,
      iva,
      total: parseFloat(infoFactura.importeTotal),
      items: items.map((item) => ({
        descripcion: item.descripcion,
        cantidad: parseFloat(item.cantidad),
        precioUnitario: parseFloat(item.precioUnitario),
        subtotal: parseFloat(item.precioTotalSinImpuesto),
      })),
    };
  }

  /**
   * Create PDF document
   */
  private async createPDF(data: InvoiceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Header
        doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .text('FACTURA ELECTRÓNICA', { align: 'center' });

        doc.moveDown();

        // Issuer info
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text(data.razonSocialEmisor)
          .font('Helvetica')
          .fontSize(10)
          .text(data.nombreComercial)
          .text(`RUC: ${data.rucEmisor}`)
          .text(`Dirección: ${data.direccionEmisor}`);

        doc.moveDown();

        // Invoice number and date
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(`No. ${data.numeroComprobante}`, { align: 'right' })
          .font('Helvetica')
          .text(`Fecha: ${data.fechaEmision}`, { align: 'right' })
          .text(`Ambiente: ${data.ambiente}`, { align: 'right' });

        doc.moveDown();

        // Buyer info
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('DATOS DEL CLIENTE')
          .font('Helvetica')
          .text(`Razón Social: ${data.razonSocialComprador}`)
          .text(`RUC/CI: ${data.identificacionComprador}`);

        doc.moveDown();

        // Items table header
        const tableTop = doc.y;
        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .text('Descripción', 50, tableTop, { width: 250, continued: true })
          .text('Cant.', { width: 50, continued: true })
          .text('P. Unit.', { width: 80, continued: true })
          .text('Subtotal', { width: 80, align: 'right' });

        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        // Items
        doc.font('Helvetica').fontSize(9);
        data.items.forEach((item) => {
          const itemY = doc.y;
          doc
            .text(item.descripcion, 50, itemY, { width: 250, continued: true })
            .text(item.cantidad.toFixed(2), { width: 50, continued: true })
            .text(`$${item.precioUnitario.toFixed(2)}`, { width: 80, continued: true })
            .text(`$${item.subtotal.toFixed(2)}`, { width: 80, align: 'right' });
          doc.moveDown(0.3);
        });

        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        // Totals
        const totalsX = 400;
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Subtotal:', totalsX, doc.y, { continued: true })
          .text(`$${data.subtotal.toFixed(2)}`, { align: 'right' })
          .text('IVA:', totalsX, doc.y, { continued: true })
          .text(`$${data.iva.toFixed(2)}`, { align: 'right' })
          .text('TOTAL:', totalsX, doc.y, { continued: true })
          .text(`$${data.total.toFixed(2)}`, { align: 'right' });

        doc.moveDown(2);

        // Authorization info
        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .text('INFORMACIÓN DE AUTORIZACIÓN', { align: 'center' });

        doc
          .font('Helvetica')
          .fontSize(8)
          .text(`Número de Autorización: ${data.numeroAutorizacion}`, { align: 'center' })
          .text(`Fecha de Autorización: ${data.fechaAutorizacion}`, { align: 'center' })
          .text(`Clave de Acceso:`, { align: 'center' })
          .text(data.claveAcceso, { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
