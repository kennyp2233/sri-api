import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Habilitar validación global con transformación
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Habilita la transformación de tipos
      whitelist: true, // Elimina propiedades no definidas en el DTO
      forbidNonWhitelisted: false,
    }),
  );
  
  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
}
bootstrap();
