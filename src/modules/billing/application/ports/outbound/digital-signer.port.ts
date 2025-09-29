export interface SignatureResult {
  signedXml: string;
  signatureValue: string;
  certificateInfo: {
    subject: string;
    issuer: string;
    validFrom: Date;
    validTo: Date;
    serialNumber: string;
  };
}

export interface DigitalSignerPort {
  signXml(xmlString: string): Promise<SignatureResult>;
}