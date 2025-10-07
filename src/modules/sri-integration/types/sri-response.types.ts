// Interfaces basadas en la documentación técnica del SRI Ecuador
// Referencia: Guía de Integración Factura Electrónica SRI

export interface Mensaje {
  identificador: string;
  mensaje: string;
  informacionAdicional?: string;
  tipo: 'INFO' | 'WARNING' | 'ERROR';
}

export interface ComprobanteRecepcion {
  claveAcceso: string;
  mensajes?: {
    mensaje: Mensaje;
  }[];
}

export interface RespuestaRecepcionComprobante {
  estado: 'RECIBIDA' | 'DEVUELTA';
  comprobantes?: {
    comprobante: ComprobanteRecepcion | ComprobanteRecepcion[]; // Puede ser array o objeto único
  };
}

export interface Autorizacion {
  estado: 'AUTORIZADO' | 'NO AUTORIZADO' | 'EN PROCESO' | 'RECHAZADO';
  numeroAutorizacion?: string;
  fechaAutorizacion?: string;
  ambiente?: 'PRUEBAS' | 'PRODUCCION';
  comprobante?: string; // XML del comprobante autorizado
  mensajes?: {
    mensaje: Mensaje | Mensaje[];
  }[];
}

export interface RespuestaAutorizacionComprobante {
  claveAccesoConsultada: string;
  numeroComprobantes: string;
  autorizaciones?: {
    autorizacion: Autorizacion | Autorizacion[];
  };
}

// Interfaces unificadas para uso interno (después de parsear SOAP)
export interface SriReceiptResponse {
  estado: 'RECIBIDA' | 'DEVUELTA';
  comprobantes?: {
    comprobante: {
      claveAcceso: string;
      mensajes?: Mensaje[];
    };
  };
}

export interface SriAuthorizationResponse {
  estado: 'AUTORIZADO' | 'NO AUTORIZADO' | 'EN PROCESO' | 'RECHAZADO';
  numeroAutorizacion?: string;
  fechaAutorizacion?: string;
  ambiente?: string;
  comprobante?: string;
  mensajes?: Mensaje[];
}

// Tipos para respuestas crudas del servicio SOAP
export type SriResponse = RespuestaRecepcionComprobante | RespuestaAutorizacionComprobante;