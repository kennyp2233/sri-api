export class TaxIdentification {
  private constructor(private readonly value: string, private readonly type: string) {
    if (!this.isValid(value, type)) {
      throw new Error(`Invalid tax identification: ${value} for type ${type}`);
    }
  }

  static createRUC(value: string): TaxIdentification {
    return new TaxIdentification(value, 'RUC');
  }

  static createCedula(value: string): TaxIdentification {
    return new TaxIdentification(value, 'CEDULA');
  }

  static createConsumidorFinal(): TaxIdentification {
    return new TaxIdentification('9999999999999', 'CONSUMIDOR_FINAL');
  }

  private isValid(value: string, type: string): boolean {
    switch (type) {
      case 'RUC':
        return /^\d{13}$/.test(value);
      case 'CEDULA':
        return /^\d{10}$/.test(value);
      case 'CONSUMIDOR_FINAL':
        return value === '9999999999999';
      default:
        return false;
    }
  }

  getValue(): string {
    return this.value;
  }

  getType(): string {
    return this.type;
  }

  toString(): string {
    return this.value;
  }

  equals(other: TaxIdentification): boolean {
    return this.value === other.value && this.type === other.type;
  }
}