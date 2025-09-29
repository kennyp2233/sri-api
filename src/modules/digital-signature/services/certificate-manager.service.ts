import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as forge from 'node-forge';
import { CertificateInfo } from '../types/signature.types';

@Injectable()
export class CertificateManagerService {
  private readonly logger = new Logger(CertificateManagerService.name);

  constructor(private configService: ConfigService) {}

  async loadCertificate(): Promise<{ privateKey: forge.pki.PrivateKey; certificate: forge.pki.Certificate }> {
    const certPath = this.configService.get<string>('CERTIFICATE_PATH', './certificates/certificate.p12');
    const certPassword = this.configService.get<string>('CERTIFICATE_PASSWORD', 'password');

    try {
      // Para testing, si no existe el certificado, crear uno dummy
      if (!fs.existsSync(certPath)) {
        this.logger.warn(`Certificado no encontrado en ${certPath}, creando certificado de prueba`);
        return this.createDummyCertificate();
      }

      const certData = fs.readFileSync(certPath);
      const p12Asn1 = forge.asn1.fromDer(certData.toString('binary'));
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, certPassword);

      // Extract private key
      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
      const privateKey = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0].key;

      // Extract certificate
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certificate = certBags[forge.pki.oids.certBag][0].cert;

      this.logger.log('Certificado cargado exitosamente');
      return { privateKey, certificate };
    } catch (error) {
      this.logger.warn(`Error cargando certificado: ${error.message}, usando certificado dummy`);
      return this.createDummyCertificate();
    }
  }

  private createDummyCertificate(): { privateKey: forge.pki.PrivateKey; certificate: forge.pki.Certificate } {
    // Crear certificado dummy para testing
    const keys = forge.pki.rsa.generateKeyPair(2048);
    const cert = forge.pki.createCertificate();

    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

    const attrs = [{
      name: 'commonName',
      value: 'Test Certificate'
    }, {
      name: 'countryName',
      value: 'EC'
    }, {
      shortName: 'ST',
      value: 'Pichincha'
    }, {
      name: 'localityName',
      value: 'Quito'
    }, {
      name: 'organizationName',
      value: 'Test Organization'
    }];

    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.sign(keys.privateKey);

    return { privateKey: keys.privateKey, certificate: cert };
  }

  getCertificateInfo(certificate: forge.pki.Certificate): CertificateInfo {
    return {
      subject: certificate.subject.getField('CN')?.value || '',
      issuer: certificate.issuer.getField('CN')?.value || '',
      validFrom: certificate.validity.notBefore,
      validTo: certificate.validity.notAfter,
      serialNumber: certificate.serialNumber,
    };
  }

  validateCertificate(certificate: forge.pki.Certificate): boolean {
    const now = new Date();
    const isValid = certificate.validity.notBefore <= now && now <= certificate.validity.notAfter;

    if (!isValid) {
      this.logger.warn('Certificado expirado o no válido');
    }

    return isValid;
  }
}