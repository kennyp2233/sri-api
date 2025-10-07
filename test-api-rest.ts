/**
 * Script de prueba para el API REST del SRI
 * Prueba el endpoint POST /invoice con datos reales
 */

import * as fs from 'fs';
import * as path from 'path';
import * as FormData from 'form-data';
import axios from 'axios';

const API_URL = 'http://localhost:3000';

async function testInvoiceAPI() {
  console.log('🧪 ===== PRUEBA DEL API REST - SRI ECUADOR =====\n');
  
  try {
    // 1. Verificar que el servidor esté corriendo
    console.log('1️⃣  Verificando servidor...');
    try {
      const healthCheck = await axios.get(API_URL);
      console.log(`✅ Servidor corriendo: ${healthCheck.data || 'OK'}\n`);
    } catch (error) {
      console.error('❌ ERROR: El servidor no está corriendo en http://localhost:3000');
      console.log('💡 Ejecuta: npm run start:dev\n');
      return;
    }

    // 2. Verificar certificado
    console.log('2️⃣  Verificando certificado de prueba...');
    const certPath = path.join(process.cwd(), 'test_certificate.p12');
    
    if (!fs.existsSync(certPath)) {
      console.error('❌ ERROR: No se encontró el certificado test_certificate.p12');
      console.log('💡 Ejecuta: node create_test_cert.js\n');
      return;
    }
    console.log(`✅ Certificado encontrado: ${certPath}\n`);

    // 3. Preparar datos de la factura
    console.log('3️⃣  Preparando datos de factura de prueba...');
    const invoiceData = {
      // Emisor (RUC REAL)
      rucEmisor: '1711508547001',
      razonSocialEmisor: 'EMPRESA DE PRUEBAS S.A.',
      nombreComercial: 'EMPRESA PRUEBAS',
      direccionEmisor: 'AV. PRINCIPAL 123 Y SECUNDARIA, QUITO',
      
      // Establecimiento
      establecimiento: '002',
      puntoEmision: '001',
      secuencial: String(Math.floor(Math.random() * 1000) + 1).padStart(9, '0'),
      
      // Fecha actual
      fechaEmision: new Date().toLocaleDateString('es-EC', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
      
      // Ambiente
      ambiente: '1', // 1 = Pruebas
      
      // Comprador
      identificacionComprador: '9999999999999',
      razonSocialComprador: 'CONSUMIDOR FINAL',
      direccionComprador: 'QUITO - ECUADOR',
      emailComprador: 'prueba@example.com',
      
      // Certificado
      certificadoPassword: 'testpassword'
    };

    // Items de la factura
    const items = [
      {
        codigoPrincipal: 'PROD001',
        descripcion: 'PRODUCTO DE PRUEBA 1',
        cantidad: 2,
        precioUnitario: 10.50,
        descuento: 0
      },
      {
        codigoPrincipal: 'PROD002',
        descripcion: 'PRODUCTO DE PRUEBA 2',
        cantidad: 1,
        precioUnitario: 25.00,
        descuento: 0
      }
    ];

    console.log('✅ Datos preparados:');
    console.log(`   RUC Emisor: ${invoiceData.rucEmisor}`);
    console.log(`   Secuencial: ${invoiceData.secuencial}`);
    console.log(`   Fecha: ${invoiceData.fechaEmision}`);
    console.log(`   Items: ${items.length}\n`);

    // 4. Enviar factura al API
    console.log('4️⃣  Enviando factura al API...');
    console.log(`   URL: ${API_URL}/invoice\n`);

    const formData = new FormData();
    
    // Agregar certificado
    formData.append('certificado', fs.createReadStream(certPath));
    
    // Agregar datos de la factura
    Object.keys(invoiceData).forEach(key => {
      formData.append(key, invoiceData[key]);
    });
    
    // Agregar items
    items.forEach((item, index) => {
      Object.keys(item).forEach(key => {
        formData.append(`items[${index}][${key}]`, item[key]);
      });
    });

    console.log('   📤 Enviando request...');
    const startTime = Date.now();
    
    const response = await axios.post(`${API_URL}/invoice`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 60000, // 60 segundos
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`   ✅ Respuesta recibida en ${duration}s\n`);

    // 5. Mostrar respuesta
    console.log('📬 RESPUESTA DE RECEPCIÓN:');
    console.log('─'.repeat(60));
    console.log(JSON.stringify(response.data, null, 2));
    console.log('─'.repeat(60));

    const { claveAcceso, estado, mensajes, mensaje } = response.data;

    if (estado === 'RECIBIDA' || estado === 'RECIBIDO') {
      console.log('\n✅ ¡Comprobante RECIBIDO por el SRI!\n');
      console.log(`📋 Clave de Acceso: ${claveAcceso}`);
      
      if (mensajes && mensajes.length > 0) {
        console.log('\n📝 Mensajes del SRI:');
        mensajes.forEach((m, i) => {
          console.log(`   ${i + 1}. [${m.tipo}] ${m.identificador}: ${m.mensaje}`);
        });
      }

      // 6. Consultar autorización
      console.log('\n5️⃣  Consultando autorización...');
      console.log('   (Esperando 5 segundos antes de consultar...)\n');
      
      await new Promise(resolve => setTimeout(resolve, 5000));

      console.log(`   URL: ${API_URL}/invoice/${claveAcceso}\n`);
      const authStartTime = Date.now();
      
      const authResponse = await axios.get(`${API_URL}/invoice/${claveAcceso}`, {
        timeout: 60000,
      });

      const authDuration = ((Date.now() - authStartTime) / 1000).toFixed(2);
      console.log(`   ✅ Respuesta recibida en ${authDuration}s\n`);

      console.log('📋 RESPUESTA DE AUTORIZACIÓN:');
      console.log('─'.repeat(60));
      console.log(JSON.stringify(authResponse.data, null, 2));
      console.log('─'.repeat(60));

      if (authResponse.data.estado === 'AUTORIZADO') {
        console.log('\n🎉 ¡FACTURA AUTORIZADA POR EL SRI!\n');
        console.log(`✅ Número de Autorización: ${authResponse.data.numeroAutorizacion}`);
        console.log(`📅 Fecha de Autorización: ${authResponse.data.fechaAutorizacion}`);
        console.log(`🌍 Ambiente: ${authResponse.data.ambiente}`);
        
        // Guardar XML y RIDE si están disponibles
        if (authResponse.data.xml) {
          const xmlPath = path.join(process.cwd(), `factura-${claveAcceso}.xml`);
          fs.writeFileSync(xmlPath, Buffer.from(authResponse.data.xml, 'base64'));
          console.log(`📄 XML guardado: ${xmlPath}`);
        }
        
        if (authResponse.data.ride) {
          const ridePath = path.join(process.cwd(), `factura-${claveAcceso}.pdf`);
          fs.writeFileSync(ridePath, Buffer.from(authResponse.data.ride, 'base64'));
          console.log(`📄 RIDE guardado: ${ridePath}`);
        }

      } else {
        console.log(`\n⚠️  Estado: ${authResponse.data.estado}`);
        
        if (authResponse.data.mensajes && authResponse.data.mensajes.length > 0) {
          console.log('\n📝 Mensajes del SRI:');
          authResponse.data.mensajes.forEach((m, i) => {
            console.log(`   ${i + 1}. [${m.tipo}] ${m.identificador}: ${m.mensaje}`);
          });
        }
      }

    } else {
      console.log('\n❌ Comprobante DEVUELTO por el SRI\n');
      
      if (mensajes && mensajes.length > 0) {
        console.log('📝 Mensajes del SRI:');
        mensajes.forEach((m, i) => {
          console.log(`   ${i + 1}. [${m.tipo}] ${m.identificador}: ${m.mensaje}`);
        });
      }
    }

    console.log('\n✅ ===== PRUEBA COMPLETADA =====\n');

  } catch (error) {
    console.error('\n❌ ERROR EN PRUEBA:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Respuesta:', error.response.data);
    } else if (error.request) {
      console.error('No se recibió respuesta del servidor');
      console.error('Detalles:', error.message);
    } else {
      console.error('Error:', error.message);
    }
    
    if (error.stack) {
      console.error('\n📚 Stack trace:');
      console.error(error.stack);
    }
  }
}

// Ejecutar prueba
if (require.main === module) {
  testInvoiceAPI()
    .then(() => {
      console.log('✅ Script finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

export { testInvoiceAPI };
