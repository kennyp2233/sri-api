/**
 * Configuración general de la aplicación
 */
export const appConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  environment: process.env.NODE_ENV || 'development',
};