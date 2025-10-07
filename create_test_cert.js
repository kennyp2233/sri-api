const forge = require('node-forge');

// Crear un certificado autofirmado válido para SRI Ecuador
const keys = forge.pki.rsa.generateKeyPair(2048);
const cert = forge.pki.createCertificate();

cert.publicKey = keys.publicKey;
cert.serialNumber = '01';
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

// Atributos del certificado según requisitos SRI
const attrs = [{
  name: 'commonName',
  value: 'Test Certificate SRI'
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
  value: 'Test Company'
}, {
  shortName: 'OU',
  value: 'Development'
}];

cert.setSubject(attrs);
cert.setIssuer(attrs);

// Extensiones requeridas para certificados de firma digital
cert.setExtensions([{
  name: 'basicConstraints',
  cA: false
}, {
  name: 'keyUsage',
  digitalSignature: true,
  nonRepudiation: true,
  keyEncipherment: true
}, {
  name: 'extKeyUsage',
  clientAuth: true,
  emailProtection: true
}, {
  name: 'nsCertType',
  client: true,
  email: true
}, {
  name: 'subjectAltName',
  altNames: [{
    type: 2, // DNS
    value: 'localhost'
  }, {
    type: 6, // URI
    value: 'http://localhost'
  }]
}]);

// Firmar el certificado con SHA-256 (requerido por SRI)
cert.sign(keys.privateKey, forge.md.sha256.create());

// Crear P12 con clave privada y certificado
const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], 'testpassword');
const p12Der = forge.asn1.toDer(p12Asn1).getBytes();

// Guardar el archivo
const fs = require('fs');
fs.writeFileSync('test_certificate.p12', p12Der, 'binary');

console.log('✅ Certificado de prueba SRI creado: test_certificate.p12');
console.log('🔐 Contraseña: testpassword');
console.log('📅 Vigencia: 1 año');
console.log('🔑 Algoritmo: RSA 2048 bits con SHA-256');
console.log('🌎 País: Ecuador (EC)');
console.log('');
console.log('Para usar en producción, obtén un certificado oficial del SRI de:');
console.log('- ANF AC Ecuador: https://www.anfac.gob.ec/');
console.log('- Security Data: https://www.securitydata.com.ec/');