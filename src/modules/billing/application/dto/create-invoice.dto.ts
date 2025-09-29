export interface CreateInvoiceCommand {
  ruc: string;
  razonSocial: string;
  items: {
    codigoPrincipal: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    descuento?: number;
    codigoPorcentajeIVA?: string; // '0', '2', '3', '6', '7'
  }[];
  ambiente?: '1' | '2'; // 1=Pruebas, 2=Producción
  establecimiento?: string;
  puntoEmision?: string;
  secuencial?: string;
}

export interface CreateInvoiceResult {
  invoice: any; // Will be updated when we refactor the entity
  xml: string;
  signedXml: string;
  sriResponse: any;
}