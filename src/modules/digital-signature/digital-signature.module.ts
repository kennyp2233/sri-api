import { Module } from '@nestjs/common';
import { XadesSignerService } from './services/xades-signer.service';
import { XmlValidatorService } from './services/xml-validator.service';

@Module({
    providers: [XadesSignerService, XmlValidatorService],
    exports: [XadesSignerService, XmlValidatorService],
})
export class DigitalSignatureModule {}