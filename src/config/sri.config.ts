/**
 * Configuración de endpoints del SRI Ecuador
 * 
 * Ambientes disponibles:
 * - PRUEBAS (celcer.sri.gob.ec): Para desarrollo y certificación
 * - PRODUCCIÓN (comprobantes.sri.gob.ec): Para facturación real
 */
export const sriConfig = {
  // Ambiente actual (usar variables de entorno para cambiar)
  recepcionWsdl: process.env.SRI_RECEPCION_WSDL || 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl',
  autorizacionWsdl: process.env.SRI_AUTORIZACION_WSDL || 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl',
  
  // Endpoints de producción (comentados por defecto)
  // recepcionWsdl: 'https://comprobantes.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl',
  // autorizacionWsdl: 'https://comprobantes.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl',
};