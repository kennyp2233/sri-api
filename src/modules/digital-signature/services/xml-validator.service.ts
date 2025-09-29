import { Injectable, Logger } from '@nestjs/common';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

@Injectable()
export class XmlValidatorService {
  private readonly logger = new Logger(XmlValidatorService.name);
  private readonly parser: XMLParser;
  private readonly builder: XMLBuilder;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      parseAttributeValue: true,
      trimValues: true,
    });

    this.builder = new XMLBuilder({
      ignoreAttributes: false,
      format: true,
    });
  }

  validateXmlStructure(xmlString: string): boolean {
    try {
      const parsed = this.parser.parse(xmlString);
      this.logger.log('XML válido estructuralmente');

      // Validar elementos requeridos básicos
      if (!parsed.factura) {
        throw new Error('Elemento raíz factura no encontrado');
      }

      if (!parsed.factura.infoTributaria) {
        throw new Error('infoTributaria requerido');
      }

      if (!parsed.factura.infoFactura) {
        throw new Error('infoFactura requerido');
      }

      if (!parsed.factura.detalles) {
        throw new Error('detalles requerido');
      }

      return true;
    } catch (error) {
      this.logger.error(`XML inválido: ${error.message}`);
      return false;
    }
  }

  parseXml(xmlString: string): any {
    try {
      return this.parser.parse(xmlString);
    } catch (error) {
      this.logger.error(`Error parseando XML: ${error.message}`);
      throw error;
    }
  }

  buildXml(obj: any): string {
    try {
      return this.builder.build(obj);
    } catch (error) {
      this.logger.error(`Error construyendo XML: ${error.message}`);
      throw error;
    }
  }

  removeSignature(xmlString: string): string {
    // Remover firma para validación previa
    return xmlString.replace(/<ds:Signature[\s\S]*?<\/ds:Signature>/g, '');
  }

  addSignaturePlaceholder(xmlString: string): string {
    // Agregar placeholder para firma
    const signaturePlaceholder = '<ds:Signature Id="signature">\n<!-- Firma XAdES-BES -->\n</ds:Signature>';
    return xmlString.replace('</factura>', `${signaturePlaceholder}\n</factura>`);
  }
}