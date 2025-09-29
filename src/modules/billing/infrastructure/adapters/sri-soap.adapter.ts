import { Injectable } from '@nestjs/common';
import { SriGatewayPort, SriReceiptResponse, AuthorizationResponse } from '../../application/ports/outbound/sri-gateway.port';
import { SriClientService } from '../../../sri-integration/services/sri-client.service';

@Injectable()
export class SriSoapAdapter implements SriGatewayPort {
  constructor(private readonly sriClient: SriClientService) {}

  async sendInvoice(signedXml: string): Promise<SriReceiptResponse> {
    const response = await this.sriClient.connectToSri(signedXml);

    // Transform the response to match our port interface
    return {
      estado: response.estado || 'DEVUELTA',
      comprobantes: response.comprobantes ? {
        comprobante: {
          claveAcceso: response.comprobantes.comprobante?.claveAcceso || 'N/A',
          mensajes: response.comprobantes.comprobante?.mensajes ? [{
            mensaje: {
              identificador: response.comprobantes.comprobante.mensajes.mensaje?.identificador || '00',
              mensaje: response.comprobantes.comprobante.mensajes.mensaje?.mensaje || 'Mensaje no disponible',
              informacionAdicional: response.comprobantes.comprobante.mensajes.mensaje?.informacionAdicional,
              tipo: response.comprobantes.comprobante.mensajes.mensaje?.tipo || 'INFO',
            }
          }] : undefined,
        }
      } : undefined,
    };
  }

  async checkAuthorization(accessKey: string): Promise<AuthorizationResponse> {
    // For now, return a mock response. In a real implementation,
    // this would call the SRI authorization service
    return {
      estado: 'EN PROCESO',
      mensajes: [{
        mensaje: {
          identificador: '00',
          mensaje: 'Autorización en proceso',
          tipo: 'INFO',
        }
      }],
    };
  }
}