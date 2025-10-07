import { Injectable, Logger } from '@nestjs/common';
import { SendInvoiceDto } from '../../application/dto/send-invoice.dto';

@Injectable()
export class SriXmlGeneratorService {
  private readonly logger = new Logger(SriXmlGeneratorService.name);

  /**
   * Generate SRI-compliant XML from invoice data
   */
  async generateInvoiceXml(invoiceData: SendInvoiceDto, claveAcceso: string): Promise<string> {
    try {
      this.logger.log('Generating SRI invoice XML');

      // Calculate totals
      const subtotal = invoiceData.items.reduce((sum, item) => {
        const itemSubtotal = item.cantidad * item.precioUnitario - (item.descuento || 0);
        return sum + itemSubtotal;
      }, 0);

      const iva = subtotal * 0.15; // 15% IVA (adjust based on your needs)
      const total = subtotal + iva;

      const ambiente = invoiceData.ambiente || '1';

      // Build XML according to SRI schema v2.1.0
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<factura id="comprobante" version="2.1.0">
  <infoTributaria>
    <ambiente>${ambiente}</ambiente>
    <tipoEmision>1</tipoEmision>
    <razonSocial>${this.escapeXml(invoiceData.razonSocialEmisor)}</razonSocial>
    <nombreComercial>${this.escapeXml(invoiceData.nombreComercial || invoiceData.razonSocialEmisor)}</nombreComercial>
    <ruc>${invoiceData.rucEmisor}</ruc>
    <claveAcceso>${claveAcceso}</claveAcceso>
    <codDoc>01</codDoc>
    <estab>${invoiceData.establecimiento}</estab>
    <ptoEmi>${invoiceData.puntoEmision}</ptoEmi>
    <secuencial>${invoiceData.secuencial.padStart(9, '0')}</secuencial>
    <dirMatriz>${this.escapeXml(invoiceData.direccionEmisor)}</dirMatriz>
  </infoTributaria>
  <infoFactura>
    <fechaEmision>${invoiceData.fechaEmision}</fechaEmision>
    <dirEstablecimiento>${this.escapeXml(invoiceData.direccionEmisor)}</dirEstablecimiento>
    <obligadoContabilidad>SI</obligadoContabilidad>
    <tipoIdentificacionComprador>${this.getTipoIdentificacion(invoiceData.identificacionComprador)}</tipoIdentificacionComprador>
    <razonSocialComprador>${this.escapeXml(invoiceData.razonSocialComprador)}</razonSocialComprador>
    <identificacionComprador>${invoiceData.identificacionComprador}</identificacionComprador>
    <direccionComprador>${this.escapeXml(invoiceData.direccionComprador || 'N/A')}</direccionComprador>
    <totalSinImpuestos>${subtotal.toFixed(2)}</totalSinImpuestos>
    <totalDescuento>0.00</totalDescuento>
    <totalConImpuestos>
      <totalImpuesto>
        <codigo>2</codigo>
        <codigoPorcentaje>2</codigoPorcentaje>
        <descuentoAdicional>0.00</descuentoAdicional>
        <baseImponible>${subtotal.toFixed(2)}</baseImponible>
        <valor>${iva.toFixed(2)}</valor>
      </totalImpuesto>
    </totalConImpuestos>
    <propina>0.00</propina>
    <importeTotal>${total.toFixed(2)}</importeTotal>
    <moneda>DOLAR</moneda>
    <pagos>
      <pago>
        <formaPago>01</formaPago>
        <total>${total.toFixed(2)}</total>
        <plazo>0</plazo>
        <unidadTiempo>DIAS</unidadTiempo>
      </pago>
    </pagos>
  </infoFactura>
  <detalles>
${this.generateDetallesXml(invoiceData.items)}
  </detalles>
  ${invoiceData.emailComprador ? `<infoAdicional>
    <campoAdicional nombre="Email">${this.escapeXml(invoiceData.emailComprador)}</campoAdicional>
  </infoAdicional>` : ''}
</factura>`;

      this.logger.log('Invoice XML generated successfully');
      return xml;
    } catch (error) {
      this.logger.error(`Error generating XML: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate XML for invoice items (detalles)
   */
  private generateDetallesXml(items: any[]): string {
    return items
      .map((item, index) => {
        const subtotal = item.cantidad * item.precioUnitario - (item.descuento || 0);
        const iva = subtotal * 0.15;

        return `    <detalle>
      <codigoPrincipal>${item.codigoPrincipal || `ITEM-${index + 1}`}</codigoPrincipal>
      <descripcion>${this.escapeXml(item.descripcion)}</descripcion>
      <cantidad>${item.cantidad.toFixed(2)}</cantidad>
      <precioUnitario>${item.precioUnitario.toFixed(6)}</precioUnitario>
      <descuento>${(item.descuento || 0).toFixed(2)}</descuento>
      <precioTotalSinImpuesto>${subtotal.toFixed(2)}</precioTotalSinImpuesto>
      <impuestos>
        <impuesto>
          <codigo>2</codigo>
          <codigoPorcentaje>2</codigoPorcentaje>
          <tarifa>15</tarifa>
          <baseImponible>${subtotal.toFixed(2)}</baseImponible>
          <valor>${iva.toFixed(2)}</valor>
        </impuesto>
      </impuestos>
    </detalle>`;
      })
      .join('\n');
  }

  /**
   * Determine identification type based on length
   */
  private getTipoIdentificacion(identificacion: string): string {
    if (identificacion.length === 13) return '04'; // RUC
    if (identificacion.length === 10) return '05'; // Cédula
    return '06'; // Pasaporte
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
