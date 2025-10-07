/**
 * Configuración de certificados digitales
 * 
 * Nota: Esta clave es opcional y se usaría si decides implementar
 * almacenamiento encriptado de certificados en el futuro.
 * Actualmente la API es stateless y recibe el certificado en cada request.
 */
export const certificateConfig = {
  encryptionKey: process.env.CERTIFICATE_ENCRYPTION_KEY || 'your-encryption-key-here-change-in-production',
};