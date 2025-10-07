import { IsString, IsNotEmpty, IsNumber, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class InvoiceItemDto {
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  cantidad: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  precioUnitario: number;

  @Transform(({ value }) => value ? parseFloat(value) : 0)
  @IsNumber()
  @IsOptional()
  descuento?: number;

  @IsString()
  @IsOptional()
  codigoPrincipal?: string;
}

export class SendInvoiceDto {
  // Información del emisor
  @IsString()
  @IsNotEmpty()
  rucEmisor: string;

  @IsString()
  @IsNotEmpty()
  razonSocialEmisor: string;

  @IsString()
  @IsOptional()
  nombreComercial?: string;

  @IsString()
  @IsNotEmpty()
  direccionEmisor: string;

  @IsString()
  @IsNotEmpty()
  establecimiento: string; // 001

  @IsString()
  @IsNotEmpty()
  puntoEmision: string; // 001

  @IsString()
  @IsNotEmpty()
  secuencial: string; // 000000001

  // Información del comprador
  @IsString()
  @IsNotEmpty()
  identificacionComprador: string;

  @IsString()
  @IsNotEmpty()
  razonSocialComprador: string;

  @IsString()
  @IsOptional()
  direccionComprador?: string;

  @IsString()
  @IsOptional()
  emailComprador?: string;

  // Detalles de la factura
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @IsString()
  @IsNotEmpty()
  fechaEmision: string; // DD/MM/YYYY

  // Certificado P12
  @IsString()
  @IsNotEmpty()
  certificadoPassword: string;

  // Ambiente (opcional, por defecto pruebas)
  @IsString()
  @IsOptional()
  ambiente?: '1' | '2'; // 1=Pruebas, 2=Producción
}
