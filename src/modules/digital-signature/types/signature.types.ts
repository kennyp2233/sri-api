export interface SignatureConfig {
  certificatePath: string;
  certificatePassword: string;
  signatureAlgorithm: string;
}

export interface CertificateInfo {
  subject: string;
  issuer: string;
  validFrom: Date;
  validTo: Date;
  serialNumber: string;
}

export interface SignatureResult {
  signedXml: string;
  signatureValue: string;
  certificateInfo: CertificateInfo;
}