import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CreateInvoiceUseCase } from './modules/billing/application/use-cases/create-invoice.use-case';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const createInvoiceUseCase = app.get(CreateInvoiceUseCase);

  // Crear factura de prueba
  try {
    const result = await createInvoiceUseCase.execute({
      ruc: '1234567890001',
      razonSocial: 'Empresa de Prueba S.A.',
      items: [
        {
          codigoPrincipal: '001',
          descripcion: 'Producto de prueba',
          cantidad: 1,
          precioUnitario: 100.00,
          descuento: 0,
          codigoPorcentajeIVA: '2', // 12%
        }
      ],
      ambiente: '1', // Pruebas
      establecimiento: '001',
      puntoEmision: '001',
      secuencial: '000000001',
    });

    console.log('Factura creada exitosamente:');
    console.log('Clave de acceso:', result.invoice.accessKey);
    console.log('Estado SRI:', result.sriResponse?.estado || 'No disponible');
  } catch (error) {
    console.error('Error creando factura:', error.message);
  }

  await app.close();
}
bootstrap();
