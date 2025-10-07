import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as soap from 'soap';
import { RespuestaRecepcionComprobante, RespuestaAutorizacionComprobante } from '../../types/sri-response.types';
import { sriConfig } from '../../../../config/sri.config';

interface CachedClient {
  client: soap.Client;
  timestamp: number;
}

@Injectable()
export class SriClientService {
  private readonly logger = new Logger(SriClientService.name);
  private recepcionClient: CachedClient | null = null;
  private autorizacionClient: CachedClient | null = null;
  private readonly CACHE_TTL = 3600000; // 1 hour
  private readonly SOAP_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 2000; // 2 seconds

  constructor(private configService: ConfigService) {}

  /**
   * Get or create a cached SOAP client for reception
   */
  private async getRecepcionClient(): Promise<soap.Client> {
    const now = Date.now();

    // Check if cache is valid
    if (this.recepcionClient && (now - this.recepcionClient.timestamp) < this.CACHE_TTL) {
      this.logger.debug('Using cached reception client');
      return this.recepcionClient.client;
    }

    // Create new client
    const wsdlUrl = sriConfig.recepcionWsdl;

    this.logger.log(`Creating new reception SOAP client: ${wsdlUrl}`);

    const client = await soap.createClientAsync(wsdlUrl, {
      disableCache: false,
      escapeXML: false,
    } as any);

    this.recepcionClient = {
      client,
      timestamp: now,
    };

    return client;
  }

  /**
   * Get or create a cached SOAP client for authorization
   */
  private async getAutorizacionClient(): Promise<soap.Client> {
    const now = Date.now();

    // Check if cache is valid
    if (this.autorizacionClient && (now - this.autorizacionClient.timestamp) < this.CACHE_TTL) {
      this.logger.debug('Using cached authorization client');
      return this.autorizacionClient.client;
    }

    // Create new client
    const wsdlUrl = sriConfig.autorizacionWsdl;

    this.logger.log(`Creating new authorization SOAP client: ${wsdlUrl}`);

    const client = await soap.createClientAsync(wsdlUrl, {
      disableCache: false,
      escapeXML: false,
    } as any);

    this.autorizacionClient = {
      client,
      timestamp: now,
    };

    return client;
  }

  /**
   * Retry wrapper with exponential backoff
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    operationName: string,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt < this.MAX_RETRIES) {
          const delay = this.RETRY_DELAY * Math.pow(2, attempt - 1);
          this.logger.warn(
            `${operationName} attempt ${attempt} failed: ${error.message}. Retrying in ${delay}ms...`
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    this.logger.error(`${operationName} failed after ${this.MAX_RETRIES} attempts`);
    throw lastError;
  }

  /**
   * Send invoice to SRI for reception
   * Según documentación del SRI, el XML se envía como string (no base64)
   */
  async connectToSri(xmlFactura: string): Promise<RespuestaRecepcionComprobante> {
    if (!xmlFactura) {
      throw new Error('XML de factura es requerido para enviar al SRI');
    }

    return this.retryWithBackoff(async () => {
      const client = await this.getRecepcionClient();

      // El WSDL define xml como xs:base64Binary - debemos codificar en base64
      const xmlBase64 = Buffer.from(xmlFactura, 'utf-8').toString('base64');
      
      const args = { xml: xmlBase64 };

      this.logger.log(`Sending XML to SRI (length: ${xmlFactura.length} chars)`);
      this.logger.debug(`XML Preview: ${xmlFactura.substring(0, 200)}...`);
      
      // Guardar XML completo para debug (solo en desarrollo)
      if (process.env.NODE_ENV !== 'production') {
        const fs = require('fs');
        const path = require('path');
        const debugPath = path.join(process.cwd(), 'debug-xml-sent-to-sri.xml');
        fs.writeFileSync(debugPath, xmlFactura, 'utf8');
        this.logger.debug(`XML completo guardado en: ${debugPath}`);
      }
      
      const result = await client.validarComprobanteAsync(args);

      this.logger.log(`SRI reception response: ${JSON.stringify(result[0], null, 2)}`);
      
      // La respuesta viene en result[0].RespuestaRecepcionComprobante según la librería soap
      const response = result[0]?.RespuestaRecepcionComprobante || result[0];
      
      return response;
    }, 'SRI Reception');
  }

  /**
   * Check authorization status for a voucher
   * La respuesta del SRI puede venir anidada en diferentes niveles
   */
  async checkAuthorizationStatus(accessKey: string): Promise<RespuestaAutorizacionComprobante> {
    if (!accessKey || accessKey.length !== 49) {
      throw new Error('Access key must be 49 characters');
    }

    this.logger.log(`Checking authorization status for: ${accessKey}`);

    return this.retryWithBackoff(async () => {
      const client = await this.getAutorizacionClient();

      const args = {
        claveAccesoComprobante: accessKey,
      };

      const result = await client.autorizacionComprobanteAsync(args);
      this.logger.log(`SRI authorization response: ${JSON.stringify(result[0], null, 2)}`);

      // La respuesta puede venir directamente en result[0] o anidada
      // Intentar extraer la respuesta del formato correcto
      let respuesta = result[0];
      
      // Si viene anidada en RespuestaAutorizacionComprobante
      if (respuesta?.RespuestaAutorizacionComprobante) {
        respuesta = respuesta.RespuestaAutorizacionComprobante;
      }

      // Verificar que tengamos los datos mínimos
      if (!respuesta || !respuesta.claveAccesoConsultada) {
        this.logger.error('Respuesta inválida del SRI:', respuesta);
        throw new Error('No authorization data received from SRI service');
      }

      return respuesta as RespuestaAutorizacionComprobante;
    }, 'SRI Authorization Check');
  }

  /**
   * Clear cached clients (useful for testing or forcing reconnection)
   */
  clearCache(): void {
    this.logger.log('Clearing SOAP client cache');
    this.recepcionClient = null;
    this.autorizacionClient = null;
  }
}