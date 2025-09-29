export class DomainException extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'DomainException';
  }
}

export class InvalidInvoiceException extends DomainException {
  constructor(message: string) {
    super(message, 'INVALID_INVOICE');
    this.name = 'InvalidInvoiceException';
  }
}

export class SriIntegrationException extends DomainException {
  constructor(message: string, public readonly sriErrorCode?: string) {
    super(message, 'SRI_INTEGRATION_ERROR');
    this.name = 'SriIntegrationException';
  }
}

export class TaxCalculationException extends DomainException {
  constructor(message: string) {
    super(message, 'TAX_CALCULATION_ERROR');
    this.name = 'TaxCalculationException';
  }
}