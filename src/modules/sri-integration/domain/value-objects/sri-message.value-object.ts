export class SriMessage {
  constructor(
    public readonly identifier: string,
    public readonly message: string,
    public readonly additionalInfo?: string,
    public readonly type: 'ERROR' | 'INFO' | 'WARNING' = 'INFO'
  ) {}

  static fromRaw(raw: any): SriMessage {
    return new SriMessage(
      raw.identificador || raw.identifier || '',
      raw.mensaje || raw.message || '',
      raw.informacionAdicional || raw.additionalInfo,
      raw.tipo || raw.type || 'INFO'
    );
  }

  toJSON() {
    return {
      identificador: this.identifier,
      mensaje: this.message,
      informacionAdicional: this.additionalInfo,
      tipo: this.type,
    };
  }
}