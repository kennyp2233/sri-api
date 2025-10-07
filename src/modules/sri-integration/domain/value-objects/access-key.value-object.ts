export class AccessKey {
  private constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error(`Invalid access key format: ${value}`);
    }
  }

  static create(value: string): AccessKey {
    return new AccessKey(value);
  }

  private isValid(value: string): boolean {
    // SRI access key must be exactly 49 digits
    return /^\d{49}$/.test(value);
  }

  getValue(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: AccessKey): boolean {
    return this.value === other.value;
  }
}