import { Module } from '@nestjs/common';
import { XadesSignerService } from './services/xades-signer.service';
import { CertificateManagerService } from './services/certificate-manager.service';
import { XmlValidatorService } from './services/xml-validator.service';

@Module({
    providers: [XadesSignerService, CertificateManagerService, XmlValidatorService],
    exports: [XadesSignerService, CertificateManagerService, XmlValidatorService],
})
export class DigitalSignatureModule { }