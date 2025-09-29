export class Invoice {
  public accessKey: string;

  constructor(
    public readonly id: string,
    public readonly ruc: string,
    public readonly razonSocial: string,
    public readonly fechaEmision: Date,
    public readonly ambiente: '1' | '2', // 1=Pruebas, 2=Producción
    public readonly tipoEmision: '1' | '2', // 1=Normal, 2=Indisponibilidad
    public readonly establecimiento: string,
    public readonly puntoEmision: string,
    public readonly secuencial: string,
    public readonly items: InvoiceItem[],
    public readonly totalSinImpuestos: number,
    public readonly totalDescuento: number,
    public readonly totalConImpuestos: ImpuestoTotal[],
    public readonly importeTotal: number,
    accessKey?: string,
  ) {
    this.accessKey = accessKey || '';
  }
}

export class InvoiceItem {
  constructor(
    public readonly codigoPrincipal: string,
    public readonly descripcion: string,
    public readonly cantidad: number,
    public readonly precioUnitario: number,
    public readonly descuento: number,
    public readonly precioTotalSinImpuesto: number,
    public readonly impuestos: Impuesto[],
  ) {}
}

export class Impuesto {
  constructor(
    public readonly codigo: string, // 2=IVA
    public readonly codigoPorcentaje: string, // 0=0%, 2=12%, 3=14%, 6=Exento
    public readonly tarifa: number,
    public readonly baseImponible: number,
    public readonly valor: number,
  ) {}
}

export class ImpuestoTotal {
  constructor(
    public readonly codigo: string,
    public readonly codigoPorcentaje: string,
    public readonly baseImponible: number,
    public readonly valor: number,
  ) {}
}