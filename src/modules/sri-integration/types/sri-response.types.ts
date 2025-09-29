export interface SriResponse {
  estado: 'RECIBIDA' | 'DEVUELTA' | 'NO AUTORIZADO';
  comprobantes?: {
    comprobante: {
      claveAcceso: string;
      mensajes?: { mensaje: { identificador: string; mensaje: string } }[];
    }[];
  };
}