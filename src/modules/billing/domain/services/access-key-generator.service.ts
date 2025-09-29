import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AccessKeyGeneratorService {
  private readonly logger = new Logger(AccessKeyGeneratorService.name);

  /**
   * Genera la clave de acceso de 49 dígitos según especificaciones SRI
   * Formato: DDMMYYYY + TIPO_DOC + RUC + AMBIENTE + ESTABLECIMIENTO + PTO_EMISION + SECUENCIAL + CODIGO_NUMERICO + TIPO_EMISION
   */
  generateAccessKey(
    fechaEmision: Date,
    tipoDocumento: string, // '01' para factura
    ruc: string,
    ambiente: string, // '1' pruebas, '2' producción
    establecimiento: string, // '001'
    puntoEmision: string, // '001'
    secuencial: string, // '000000001'
    tipoEmision: string, // '1' normal
  ): string {
    try {
      // 1. Fecha en formato DDMMYYYY (8 dígitos)
      const fechaStr = this.formatDate(fechaEmision);

      // 2. Tipo de documento (2 dígitos)
      const tipoDocStr = tipoDocumento.padStart(2, '0');

      // 3. RUC (13 dígitos)
      const rucStr = ruc.padStart(13, '0');

      // 4. Ambiente (1 dígito)
      const ambienteStr = ambiente;

      // 5. Establecimiento (3 dígitos)
      const establecimientoStr = establecimiento.padStart(3, '0');

      // 6. Punto de emisión (3 dígitos)
      const puntoEmisionStr = puntoEmision.padStart(3, '0');

      // 7. Secuencial (9 dígitos)
      const secuencialStr = secuencial.padStart(9, '0');

      // 8. Código numérico (8 dígitos) - generado aleatoriamente
      const codigoNumerico = this.generateNumericCode();

      // 9. Tipo de emisión (1 dígito)
      const tipoEmisionStr = tipoEmision;

      // Concatenar todos los componentes
      const claveAccesoSinVerificar =
        fechaStr +
        tipoDocStr +
        rucStr +
        ambienteStr +
        establecimientoStr +
        puntoEmisionStr +
        secuencialStr +
        codigoNumerico +
        tipoEmisionStr;

      // Generar dígito verificador
      const digitoVerificador = this.calculateCheckDigit(claveAccesoSinVerificar);

      const claveAcceso = claveAccesoSinVerificar + digitoVerificador;

      this.logger.log(`Clave de acceso generada: ${claveAcceso}`);
      return claveAcceso;
    } catch (error) {
      this.logger.error(`Error generando clave de acceso: ${error.message}`);
      throw error;
    }
  }

  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    return day + month + year;
  }

  private generateNumericCode(): string {
    // Generar 8 dígitos aleatorios
    const randomNum = Math.floor(Math.random() * 100000000);
    return randomNum.toString().padStart(8, '0');
  }

  private calculateCheckDigit(claveAcceso: string): number {
    // Algoritmo de módulo 11 para dígito verificador SRI
    const factores = [2, 3, 4, 5, 6, 7];
    let suma = 0;

    for (let i = claveAcceso.length - 1, factorIndex = 0; i >= 0; i--, factorIndex++) {
      const digito = parseInt(claveAcceso[i]);
      const factor = factores[factorIndex % factores.length];
      suma += digito * factor;
    }

    const modulo = suma % 11;
    const digitoVerificador = 11 - modulo;

    if (digitoVerificador === 11) return 0;
    if (digitoVerificador === 10) return 1;
    return digitoVerificador;
  }
}