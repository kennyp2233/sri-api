import { Injectable, Logger } from '@nestjs/common';
import { Invoice } from '../../domain/entities/invoice.entity';
import { AccessKeyGeneratorService } from '../../domain/services/access-key-generator.service';
import { TaxCalculationService } from '../../domain/services/tax-calculation.service';

@Injectable()
export class SriXmlGeneratorService {
  private readonly logger = new Logger(SriXmlGeneratorService.name);

  constructor(
    private accessKeyGenerator: AccessKeyGeneratorService,
    private taxCalculation: TaxCalculationService,
  ) {}

  generateInvoiceXml(invoice: Invoice): string {
    try {
      this.logger.log('Generando XML de factura SRI');

      // Generar clave de acceso
      const claveAcceso = this.accessKeyGenerator.generateAccessKey(
        invoice.fechaEmision,
        '01', // Factura
        invoice.ruc,
        invoice.ambiente,
        invoice.establecimiento,
        invoice.puntoEmision,
        invoice.secuencial,
        invoice.tipoEmision,
      );

      // Actualizar la clave de acceso en la factura
      (invoice as any).accessKey = claveAcceso;

      // Construir XML según esquema SRI v2.1.0
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<factura id="comprobante" version="2.1.0">
  <infoTributaria>
    <ambiente>${invoice.ambiente}</ambiente>
    <tipoEmision>${invoice.tipoEmision}</tipoEmision>
    <razonSocial>${this.escapeXml(invoice.razonSocial)}</razonSocial>
    <nombreComercial>${this.escapeXml(invoice.razonSocial)}</nombreComercial>
    <ruc>${invoice.ruc}</ruc>
    <claveAcceso>${claveAcceso}</claveAcceso>
    <codDoc>01</codDoc>
    <estab>${invoice.establecimiento}</estab>
    <ptoEmi>${invoice.puntoEmision}</ptoEmi>
    <secuencial>${invoice.secuencial}</secuencial>
    <dirMatriz>${this.escapeXml('Dirección Matriz')}</dirMatriz>
  </infoTributaria>
  <infoFactura>
    <fechaEmision>${this.formatDate(invoice.fechaEmision)}</fechaEmision>
    <obligadoContabilidad>SI</obligadoContabilidad>
    <tipoIdentificacionComprador>07</tipoIdentificacionComprador>
    <razonSocialComprador>CONSUMIDOR FINAL</razonSocialComprador>
    <identificacionComprador>9999999999999</identificacionComprador>
    <direccionComprador>Dirección del comprador</direccionComprador>
    <totalSinImpuestos>${invoice.totalSinImpuestos.toFixed(2)}</totalSinImpuestos>
    <totalDescuento>${invoice.totalDescuento.toFixed(2)}</totalDescuento>
    <totalConImpuestos>
${this.generateTotalImpuestosXml(invoice.totalConImpuestos)}
    </totalConImpuestos>
    <propina>0.00</propina>
    <importeTotal>${invoice.importeTotal.toFixed(2)}</importeTotal>
    <moneda>DOLAR</moneda>
    <pagos>
      <pago>
        <formaPago>01</formaPago>
        <total>${invoice.importeTotal.toFixed(2)}</total>
        <plazo>0</plazo>
        <unidadTiempo>DIAS</unidadTiempo>
      </pago>
    </pagos>
  </infoFactura>
  <detalles>
${this.generateDetallesXml(invoice.items)}
  </detalles>
  <infoAdicional>
    <campoAdicional nombre="Email">cliente@email.com</campoAdicional>
  </infoAdicional>
</factura>`;

      this.logger.log('XML de factura generado exitosamente');
      return xml;
    } catch (error) {
      this.logger.error(`Error generando XML: ${error.message}`);
      throw error;
    }
  }

  private generateTotalImpuestosXml(impuestos: any[]): string {
    return impuestos.map(impuesto => `
      <totalImpuesto>
        <codigo>${impuesto.codigo}</codigo>
        <codigoPorcentaje>${impuesto.codigoPorcentaje}</codigoPorcentaje>
        <descuentoAdicional>0.00</descuentoAdicional>
        <baseImponible>${impuesto.baseImponible.toFixed(2)}</baseImponible>
        <valor>${impuesto.valor.toFixed(2)}</valor>
      </totalImpuesto>`).join('');
  }

  private generateDetallesXml(items: any[]): string {
    return items.map((item, index) => `
    <detalle>
      <codigoPrincipal>${this.escapeXml(item.codigoPrincipal)}</codigoPrincipal>
      <codigoAuxiliar>${index + 1}</codigoAuxiliar>
      <descripcion>${this.escapeXml(item.descripcion)}</descripcion>
      <cantidad>${item.cantidad.toFixed(2)}</cantidad>
      <precioUnitario>${item.precioUnitario.toFixed(6)}</precioUnitario>
      <descuento>${item.descuento.toFixed(2)}</descuento>
      <precioTotalSinImpuesto>${item.precioTotalSinImpuesto.toFixed(2)}</precioTotalSinImpuesto>
      <impuestos>
${this.generateItemImpuestosXml(item.impuestos)}
      </impuestos>
    </detalle>`).join('');
  }

  private generateItemImpuestosXml(impuestos: any[]): string {
    return impuestos.map(impuesto => `
        <impuesto>
          <codigo>${impuesto.codigo}</codigo>
          <codigoPorcentaje>${impuesto.codigoPorcentaje}</codigoPorcentaje>
          <tarifa>${impuesto.tarifa.toFixed(2)}</tarifa>
          <baseImponible>${impuesto.baseImponible.toFixed(2)}</baseImponible>
          <valor>${impuesto.valor.toFixed(2)}</valor>
        </impuesto>`).join('');
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${day}/${month}/${year}`;
  }

  private escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case "'": return '&#39;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }
}