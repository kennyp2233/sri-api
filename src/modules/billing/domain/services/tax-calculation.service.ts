import { Injectable, Logger } from '@nestjs/common';
import { InvoiceItem, Impuesto, ImpuestoTotal } from '../entities/invoice.entity';

@Injectable()
export class TaxCalculationService {
  private readonly logger = new Logger(TaxCalculationService.name);

  // Tarifas IVA según SRI Ecuador
  private readonly IVA_RATES = {
    '0': 0.00,    // 0%
    '2': 0.12,    // 12%
    '3': 0.14,    // 14% (tarifa anterior)
    '6': 0.00,    // Exento
    '7': 0.00,    // No objeto
  };

  calculateItemTaxes(item: InvoiceItem): Impuesto[] {
    const impuestos: Impuesto[] = [];

    // Calcular IVA basado en el código de porcentaje
    const tarifa = this.IVA_RATES[item.impuestos[0]?.codigoPorcentaje] || 0;
    const baseImponible = item.precioTotalSinImpuesto;
    const valor = Math.round((baseImponible * tarifa) * 100) / 100; // Redondear a 2 decimales

    impuestos.push({
      codigo: '2', // IVA
      codigoPorcentaje: item.impuestos[0]?.codigoPorcentaje || '2',
      tarifa: tarifa * 100, // Convertir a porcentaje
      baseImponible,
      valor,
    });

    return impuestos;
  }

  calculateTotalTaxes(items: InvoiceItem[]): { totalSinImpuestos: number; totalConImpuestos: ImpuestoTotal[]; importeTotal: number } {
    let totalSinImpuestos = 0;
    const impuestosMap = new Map<string, { baseImponible: number; valor: number }>();

    // Calcular totales por item
    for (const item of items) {
      totalSinImpuestos += item.precioTotalSinImpuesto;

      const itemTaxes = this.calculateItemTaxes(item);
      for (const tax of itemTaxes) {
        const key = `${tax.codigo}-${tax.codigoPorcentaje}`;
        const existing = impuestosMap.get(key) || { baseImponible: 0, valor: 0 };
        impuestosMap.set(key, {
          baseImponible: existing.baseImponible + tax.baseImponible,
          valor: existing.valor + tax.valor,
        });
      }
    }

    // Convertir mapa a array de ImpuestoTotal
    const totalConImpuestos: ImpuestoTotal[] = [];
    for (const [key, taxData] of impuestosMap) {
      const [codigo, codigoPorcentaje] = key.split('-');
      totalConImpuestos.push({
        codigo,
        codigoPorcentaje,
        baseImponible: Math.round(taxData.baseImponible * 100) / 100,
        valor: Math.round(taxData.valor * 100) / 100,
      });
    }

    // Calcular importe total
    const totalImpuestos = totalConImpuestos.reduce((sum, tax) => sum + tax.valor, 0);
    const importeTotal = Math.round((totalSinImpuestos + totalImpuestos) * 100) / 100;

    this.logger.log(`Totales calculados - Sin impuestos: ${totalSinImpuestos}, Total: ${importeTotal}`);

    return {
      totalSinImpuestos: Math.round(totalSinImpuestos * 100) / 100,
      totalConImpuestos,
      importeTotal,
    };
  }

  validateTaxCalculations(items: InvoiceItem[]): boolean {
    try {
      for (const item of items) {
        if (item.cantidad <= 0) {
          throw new Error(`Cantidad inválida en item: ${item.descripcion}`);
        }
        if (item.precioUnitario < 0) {
          throw new Error(`Precio unitario inválido en item: ${item.descripcion}`);
        }
        if (item.precioTotalSinImpuesto !== item.cantidad * (item.precioUnitario - item.descuento)) {
          throw new Error(`Precio total sin impuesto incorrecto en item: ${item.descripcion}`);
        }
      }
      return true;
    } catch (error) {
      this.logger.error(`Error validando cálculos de impuestos: ${error.message}`);
      return false;
    }
  }
}