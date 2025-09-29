import { Injectable } from '@nestjs/common';
import { DigitalSignerPort, SignatureResult } from '../../application/ports/outbound/digital-signer.port';
import { XadesSignerService } from '../../../digital-signature/services/xades-signer.service';

@Injectable()
export class DigitalSignerAdapter implements DigitalSignerPort {
  constructor(private readonly xadesSigner: XadesSignerService) {}

  async signXml(xmlString: string): Promise<SignatureResult> {
    return await this.xadesSigner.signXml(xmlString);
  }
}