export class Amount {
  private constructor(private readonly value: number) {
    if (!this.isValid(value)) {
      throw new Error(`Invalid amount: ${value}`);
    }
  }

  static create(value: number): Amount {
    return new Amount(Math.round(value * 100) / 100); // Round to 2 decimal places
  }

  static zero(): Amount {
    return new Amount(0);
  }

  private isValid(value: number): boolean {
    return !isNaN(value) && isFinite(value) && value >= 0;
  }

  add(other: Amount): Amount {
    return Amount.create(this.value + other.value);
  }

  subtract(other: Amount): Amount {
    return Amount.create(this.value - other.value);
  }

  multiply(factor: number): Amount {
    return Amount.create(this.value * factor);
  }

  getValue(): number {
    return this.value;
  }

  toString(): string {
    return this.value.toFixed(2);
  }

  equals(other: Amount): boolean {
    return Math.abs(this.value - other.value) < 0.01; // Consider equal if difference < 0.01
  }

  isGreaterThan(other: Amount): boolean {
    return this.value > other.value;
  }

  isLessThan(other: Amount): boolean {
    return this.value < other.value;
  }
}