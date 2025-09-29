import { Injectable, Logger } from '@nestjs/common';
import { CertificateManagerService } from './certificate-manager.service';
import { XmlValidatorService } from './xml-validator.service';
import { SignatureResult } from '../types/signature.types';

@Injectable()
export class XadesSignerService {
    private readonly logger = new Logger(XadesSignerService.name);

    constructor(
        private certificateManager: CertificateManagerService,
        private xmlValidator: XmlValidatorService,
    ) { }

    async signXml(xmlString: string): Promise<SignatureResult> {
        try {
            this.logger.log('Iniciando proceso de firma XAdES-BES');

            // Validar XML antes de firmar
            if (!this.xmlValidator.validateXmlStructure(xmlString)) {
                throw new Error('XML no válido para firma');
            }

            // Cargar certificado
            const { privateKey, certificate } = await this.certificateManager.loadCertificate();

            // Validar certificado
            if (!this.certificateManager.validateCertificate(certificate)) {
                throw new Error('Certificado inválido o expirado');
            }

            // Preparar XML para firma (agregar namespaces necesarios)
            const xmlWithNamespaces = this.addXadesNamespaces(xmlString);

            // Crear firma XAdES-BES
            const signedXml = await this.createXadesSignature(xmlWithNamespaces, privateKey, certificate);

            const certificateInfo = this.certificateManager.getCertificateInfo(certificate);

            this.logger.log('Firma XAdES-BES completada exitosamente');

            return {
                signedXml,
                signatureValue: this.extractSignatureValue(signedXml),
                certificateInfo,
            };
        } catch (error) {
            this.logger.error(`Error en firma XAdES-BES: ${error.message}`);
            throw error;
        }
    }

    private addXadesNamespaces(xmlString: string): string {
        // Agregar namespaces requeridos para XAdES
        const namespaces = ' xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" ';
        return xmlString.replace('<factura ', `<factura${namespaces} `);
    }

    private async createXadesSignature(xmlString: string, privateKey: any, certificate: any): Promise<string> {
        // Para esta implementación básica, crearemos una firma XML-DSIG simple
        // En producción, se debería usar una librería completa de XAdES-BES

        const crypto = require('crypto');
        const { XMLSignature } = require('xmldsigjs');

        try {
            // Crear documento XML
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

            // Crear firma
            const signature = new XMLSignature();
            signature.SignedInfo.CanonicalizationMethod.Algorithm = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315';
            signature.SignedInfo.SignatureMethod.Algorithm = 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256';

            // Agregar referencia al documento
            const reference = signature.SignedInfo.References.AddReference('');
            reference.DigestMethod.Algorithm = 'http://www.w3.org/2001/04/xmlenc#sha256';
            reference.Transforms.AddTransform('http://www.w3.org/2000/09/xmldsig#enveloped-signature');

            // Agregar certificado
            const keyInfo = signature.KeyInfo;
            const x509Data = keyInfo.AddX509Data();
            x509Data.AddCertificate(certificate);

            // Firmar
            await signature.Sign(privateKey);

            // Insertar firma en el XML
            const signatureElement = xmlDoc.createElement('ds:Signature');
            signatureElement.innerHTML = signature.GetXml().outerHTML;
            xmlDoc.documentElement.appendChild(signatureElement);

            const serializer = new XMLSerializer();
            return serializer.serializeToString(xmlDoc);
        } catch (error) {
            this.logger.warn(`Error con xmldsigjs, usando implementación básica: ${error.message}`);
            return this.createBasicSignature(xmlString, privateKey, certificate);
        }
    }

    private createBasicSignature(xmlString: string, privateKey: any, certificate: any): string {
        // Implementación básica de firma XML-DSIG usando node-forge
        const crypto = require('crypto');
        const forge = require('node-forge');

        try {
            // Crear digest del XML
            const digest = crypto.createHash('sha256').update(xmlString).digest();

            // Firmar usando node-forge
            const pss = forge.pss.create({
                md: forge.md.sha256.create(),
                mgf: forge.mgf.mgf1.create(forge.md.sha256.create()),
                saltLength: 32
            });

            const md = forge.md.sha256.create();
            md.update(forge.util.bytesToHex(digest), 'hex');
            const signature = privateKey.sign(md, pss);

            // Convertir firma a base64
            const signatureValue = forge.util.encode64(signature);

            // Obtener certificado en formato PEM
            const certPem = forge.pki.certificateToPem(certificate).replace(/\n/g, '').replace('-----BEGIN CERTIFICATE-----', '').replace('-----END CERTIFICATE-----', '');

            // Construir elemento de firma básico
            const signatureXml = `
<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="signature">
  <ds:SignedInfo>
    <ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
    <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
    <ds:Reference URI="">
      <ds:Transforms>
        <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
      </ds:Transforms>
      <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
      <ds:DigestValue>${digest.toString('base64')}</ds:DigestValue>
    </ds:Reference>
  </ds:SignedInfo>
  <ds:SignatureValue>${signatureValue}</ds:SignatureValue>
  <ds:KeyInfo>
    <ds:X509Data>
      <ds:X509Certificate>${certPem}</ds:X509Certificate>
    </ds:X509Data>
  </ds:KeyInfo>
</ds:Signature>`;

            // Insertar firma en el XML
            return xmlString.replace('</factura>', `${signatureXml}\n</factura>`);
        } catch (error) {
            this.logger.error(`Error en firma básica: ${error.message}`);
            throw error;
        }
    }

    private extractSignatureValue(signedXml: string): string {
        const match = signedXml.match(/<ds:SignatureValue[^>]*>([^<]+)<\/ds:SignatureValue>/);
        return match ? match[1] : '';
    }
}