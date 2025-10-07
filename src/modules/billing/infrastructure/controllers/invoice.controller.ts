import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SendInvoiceDto } from '../../application/dto/send-invoice.dto';
import { SriClientService } from '../../../sri-integration/infrastructure/services/sri-client.service';
import { RideGeneratorService } from '../../../sri-integration/infrastructure/services/ride-generator.service';
import { XadesSignerService } from '../../../digital-signature/services/xades-signer.service';
import { SriXmlGeneratorService } from '../xml/sri-xml-generator.service';

@Controller('invoice')
export class InvoiceController {
  private readonly logger = new Logger(InvoiceController.name);

  constructor(
    private readonly sriClient: SriClientService,
    private readonly rideGenerator: RideGeneratorService,
    private readonly xadesSigner: XadesSignerService,
    private readonly xmlGenerator: SriXmlGeneratorService,
  ) {}

  /**
   * POST /invoice
   * Send invoice to SRI
   */
  @Post()
  @UseInterceptors(FileInterceptor('certificado'))
  async sendInvoice(
    @Body() invoiceData: SendInvoiceDto,
    @UploadedFile() certificado: Express.Multer.File,
  ) {
    this.logger.log('Received invoice submission request');

    try {
      // Validate certificate file
      if (!certificado) {
        throw new BadRequestException('Certificado P12 es requerido');
      }

      if (!certificado.originalname.endsWith('.p12') && !certificado.originalname.endsWith('.pfx')) {
        throw new BadRequestException('El certificado debe ser un archivo .p12 o .pfx');
      }

      // 1. Generate access key (clave de acceso)
      const claveAcceso = this.generateAccessKey(invoiceData);
      this.logger.log(`Generated access key: ${claveAcceso}`);

      // 2. Generate XML from invoice data
      const xml = await this.xmlGenerator.generateInvoiceXml(invoiceData, claveAcceso);
      this.logger.log('Invoice XML generated');

      // 3. Sign XML with P12 certificate
      const signedResult = await this.xadesSigner.signXmlWithCertificate(
        xml,
        certificado.buffer,
        invoiceData.certificadoPassword,
      );
      this.logger.log('XML signed successfully');

      // 4. Send to SRI reception
      const receptionResponse = await this.sriClient.connectToSri(signedResult.signedXml);
      this.logger.log(`SRI reception response: ${JSON.stringify(receptionResponse)}`);

      // Build response based on estado
      const response: any = {
        claveAcceso,
        estado: receptionResponse.estado,
      };

      // Extract messages only if comprobantes exists (when estado is DEVUELTA)
      if (receptionResponse.comprobantes) {
        const comprobante = Array.isArray(receptionResponse.comprobantes.comprobante)
          ? receptionResponse.comprobantes.comprobante[0]
          : receptionResponse.comprobantes.comprobante;

        if (comprobante?.mensajes) {
          // Los mensajes vienen en un array
          const mensajesArray = Array.isArray(comprobante.mensajes)
            ? comprobante.mensajes
            : [comprobante.mensajes];

          response.mensajes = mensajesArray
            .map((item: any) => {
              const m = item.mensaje || item;
              return {
                identificador: m?.identificador,
                mensaje: m?.mensaje,
                informacionAdicional: m?.informacionAdicional,
                tipo: m?.tipo,
              };
            })
            .filter((m: any) => m.identificador); // Filter out empty messages
        } else {
          response.mensajes = [];
        }
      } else {
        // Estado RECIBIDA: no hay mensajes todavía, debe consultar autorización
        response.mensajes = [];
        response.mensaje = 'Comprobante RECIBIDO. Consulte el estado de autorización usando la clave de acceso.';
      }

      this.logger.log(`Returning response: ${JSON.stringify(response)}`);
      return response;
    } catch (error) {
      this.logger.error(`Error sending invoice: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * GET /invoice/:claveAcceso
   * Check authorization status and get RIDE + XML if authorized
   */
  @Get(':claveAcceso')
  async getInvoiceStatus(@Param('claveAcceso') claveAcceso: string) {
    this.logger.log(`Checking authorization for: ${claveAcceso}`);

    try {
      // Validate access key format
      if (!claveAcceso || claveAcceso.length !== 49) {
        throw new BadRequestException('Clave de acceso debe tener 49 dígitos');
      }

      // Check authorization status
      const authResponse = await this.sriClient.checkAuthorizationStatus(claveAcceso);

      // Extract authorization data
      const autorizacion = Array.isArray(authResponse.autorizaciones?.autorizacion)
        ? authResponse.autorizaciones.autorizacion[0]
        : authResponse.autorizaciones?.autorizacion;

      const estado = autorizacion?.estado || 'EN PROCESO';

      // Build response based on status
      const response: any = {
        claveAcceso: authResponse.claveAccesoConsultada,
        estado,
      };

      if (estado === 'AUTORIZADO') {
        // Generate RIDE PDF
        const ridePdf = await this.rideGenerator.generateRide(
          autorizacion.comprobante,
          autorizacion.numeroAutorizacion,
          autorizacion.fechaAutorizacion,
          autorizacion.ambiente,
        );

        response.numeroAutorizacion = autorizacion.numeroAutorizacion;
        response.fechaAutorizacion = autorizacion.fechaAutorizacion;
        response.ambiente = autorizacion.ambiente;
        response.xml = Buffer.from(autorizacion.comprobante).toString('base64');
        response.ride = ridePdf.toString('base64');
      } else {
        // Include messages for non-authorized invoices
        response.fechaAutorizacion = autorizacion?.fechaAutorizacion;
        response.ambiente = autorizacion?.ambiente;
        
        if (autorizacion?.mensajes) {
          // Los mensajes vienen en un array de objetos con propiedad mensaje
          const mensajesWrapper = Array.isArray(autorizacion.mensajes)
            ? autorizacion.mensajes
            : [autorizacion.mensajes];
          
          response.mensajes = mensajesWrapper
            .flatMap((wrapper: any) => {
              const mensajesData = wrapper.mensaje;
              return Array.isArray(mensajesData) ? mensajesData : [mensajesData];
            })
            .filter((m: any) => m && m.identificador)
            .map((m: any) => ({
              identificador: m.identificador,
              mensaje: m.mensaje,
              informacionAdicional: m.informacionAdicional,
              tipo: m.tipo,
            }));
        } else {
          response.mensajes = [];
        }
      }

      return response;
    } catch (error) {
      this.logger.error(`Error checking authorization: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Generate access key (49 digits)
   * Format: DDMMYYYYTCRRRUUUEESSSSSSSSCN
   */
  private generateAccessKey(data: SendInvoiceDto): string {
    const fecha = data.fechaEmision.split('/'); // DD/MM/YYYY
    const dd = fecha[0];
    const mm = fecha[1];
    const yyyy = fecha[2];

    const tipo = '01'; // 01 = Factura
    const ruc = data.rucEmisor;
    const ambiente = data.ambiente || '1'; // 1 = Pruebas
    const serie = data.establecimiento + data.puntoEmision; // 001001
    const secuencial = data.secuencial.padStart(9, '0'); // 000000001
    const codigo = Math.floor(Math.random() * 100000000)
      .toString()
      .padStart(8, '0'); // Código numérico aleatorio
    const tipoEmision = '1'; // 1 = Normal

    const claveBase =
      dd + mm + yyyy + tipo + ruc + ambiente + serie + secuencial + codigo + tipoEmision;

    // Calculate module 11 check digit
    const checkDigit = this.calculateModule11(claveBase);

    return claveBase + checkDigit;
  }

  /**
   * Calculate module 11 check digit for access key
   * Algoritmo estándar del SRI Ecuador
   */
  private calculateModule11(base: string): number {
    let factor = 2;
    let sum = 0;

    // Process from right to left
    for (let i = base.length - 1; i >= 0; i--) {
      sum += parseInt(base[i]) * factor;
      factor = factor === 7 ? 2 : factor + 1;
    }

    const remainder = sum % 11;
    let checkDigit = 11 - remainder;

    // Si el dígito verificador es 11, se reemplaza por 0
    // Si el dígito verificador es 10, se reemplaza por 1
    if (checkDigit === 11) {
      checkDigit = 0;
    } else if (checkDigit === 10) {
      checkDigit = 1;
    }

    return checkDigit;
  }
}
