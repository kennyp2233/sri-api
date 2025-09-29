export const sriConfig = {
  recepcionWsdl: process.env.SRI_RECEPCION_WSDL || 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl',
  autorizacionWsdl: process.env.SRI_AUTORIZACION_WSDL || 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl',
};