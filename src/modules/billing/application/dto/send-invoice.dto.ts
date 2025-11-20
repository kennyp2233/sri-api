import { IsString, IsNotEmpty, IsNumber, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class InvoiceItemDto {
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsNumber()
  cantidad: number;

  @IsNumber()
  precioUnitario: number;

  @IsNumber()
  @IsOptional()
  descuento?: number;

  @IsString()
  @IsOptional()
  codigoPrincipal?: string;
}

export class SendInvoiceDto {
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
  establecimiento: string;

  @IsString()
  @IsNotEmpty()
  puntoEmision: string;

  @IsString()
  @IsNotEmpty()
  secuencial: string;

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @IsString()
  @IsNotEmpty()
  fechaEmision: string;

  @IsString()
  @IsNotEmpty()
  certificadoPassword: string;

  @IsString()
  @IsOptional()
  ambiente?: '1' | '2';
}