export interface SriReceiptResponse {
  estado: 'RECIBIDA' | 'DEVUELTA';
  comprobantes?: {
    comprobante: {
      claveAcceso: string;
      mensajes?: {
        mensaje: {
          identificador: string;
          mensaje: string;
          informacionAdicional?: string;
          tipo: 'ERROR' | 'INFO' | 'WARNING';
        };
      }[];
    };
  };
}

export interface AuthorizationResponse {
  estado: 'AUTORIZADO' | 'NO AUTORIZADO' | 'EN PROCESO';
  numeroAutorizacion?: string;
  fechaAutorizacion?: string;
  ambiente?: string;
  comprobante?: string;
  mensajes?: {
    mensaje: {
      identificador: string;
      mensaje: string;
      informacionAdicional?: string;
      tipo: 'ERROR' | 'INFO' | 'WARNING';
    };
  }[];
}

export interface SriGatewayPort {
  sendInvoice(signedXml: string): Promise<SriReceiptResponse>;
  checkAuthorization(accessKey: string): Promise<AuthorizationResponse>;
}