export class AccessKey {
  private constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error(`Invalid access key format: ${value}`);
    }
  }

  static create(
    fechaEmision: Date,
    tipoDocumento: string,
    ruc: string,
    ambiente: string,
    establecimiento: string,
    puntoEmision: string,
    secuencial: string,
    tipoEmision: string,
  ): AccessKey {
    const fechaStr = AccessKey.formatDate(fechaEmision);
    const tipoDocStr = tipoDocumento.padStart(2, '0');
    const rucStr = ruc.padStart(13, '0');
    const establecimientoStr = establecimiento.padStart(3, '0');
    const puntoEmisionStr = puntoEmision.padStart(3, '0');
    const secuencialStr = secuencial.padStart(9, '0');
    const codigoNumerico = AccessKey.generateNumericCode();

    const claveAccesoSinVerificar =
      fechaStr +
      tipoDocStr +
      rucStr +
      ambiente +
      establecimientoStr +
      puntoEmisionStr +
      secuencialStr +
      codigoNumerico +
      tipoEmision;

    const digitoVerificador = AccessKey.calculateCheckDigit(claveAccesoSinVerificar);
    const claveAcceso = claveAccesoSinVerificar + digitoVerificador;

    return new AccessKey(claveAcceso);
  }

  static fromString(value: string): AccessKey {
    return new AccessKey(value);
  }

  private isValid(value: string): boolean {
    // Validar formato: 49 dígitos
    if (!/^\d{49}$/.test(value)) {
      return false;
    }

    // Validar dígito verificador
    const claveSinDigito = value.slice(0, 48);
    const digitoCalculado = AccessKey.calculateCheckDigit(claveSinDigito);
    const digitoActual = parseInt(value[48]);

    return digitoCalculado === digitoActual;
  }

  toString(): string {
    return this.value;
  }

  equals(other: AccessKey): boolean {
    return this.value === other.value;
  }

  private static formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    return day + month + year;
  }

  private static generateNumericCode(): string {
    const randomNum = Math.floor(Math.random() * 100000000);
    return randomNum.toString().padStart(8, '0');
  }

  private static calculateCheckDigit(claveAcceso: string): number {
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