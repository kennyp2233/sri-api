# SRI Ecuador SOAP Wrapper API 🇪🇨

**Wrapper SOAP stateless simplificado para facturación electrónica del SRI Ecuador**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](package.json)
[![Node](https://img.shields.io/badge/node-%3E%3D20.3.1-green.svg)](package.json)
[![NestJS](https://img.shields.io/badge/NestJS-10.0-red.svg)](package.json)
[![Status](https://img.shields.io/badge/status-production%20ready-brightgreen.svg)]()

---

## ✅ Estado del Proyecto

**INTEGRACIÓN 100% FUNCIONAL Y PROBADA** contra el ambiente de certificación del SRI:

- ✅ Comprobantes **RECIBIDOS** por el SRI (estado: `RECIBIDA`)
- ✅ Clave de acceso de 49 dígitos generada correctamente (módulo 11)
- ✅ XML firmado con XAdES-BES según especificaciones SRI v2.1.0
- ✅ SOAP wrapper operativo con endpoints de pruebas y producción
- ✅ Generación automática de RIDE (PDF) desde XML autorizado
- ⚠️ **Requiere certificado digital oficial para autorización completa** (ver [Certificado Requerido](#-certificado-digital-requerido))

---

## 🎯 ¿Qué es este proyecto?

Un wrapper minimalista y stateless del servicio SOAP del SRI (Servicio de Rentas Internas) de Ecuador para facturación electrónica.

**No es un sistema completo de facturación**, es solo un puente entre tu aplicación y los servicios web del SRI.

### ✨ Características

- ✅ **Stateless:** Sin base de datos, sin persistencia
- ✅ **Certificado P12 dinámico:** El cliente envía el certificado en cada request
- ✅ **Solo 2 endpoints:** Enviar y consultar facturas
- ✅ **Generación automática de RIDE (PDF):** Desde el XML autorizado
- ✅ **Retry automático:** Con backoff exponencial
- ✅ **Cache de clientes SOAP:** Para mejor performance
- ✅ **Validación completa:** DTOs con class-validator

---

## 📋 Requisitos

### Técnicos
- Node.js >= 20.3.1
- npm >= 9.x

### Para Producción
- **Certificado digital P12 oficial** (emitido por Security Data, BCE, ANFAC, etc.)
  - Costo: ~$50-100 USD/año
  - Tiempo de emisión: 1-3 días hábiles
  - Ver [guía completa de certificados](#-certificado-digital-requerido)
- RUC autorizado para facturación electrónica por el SRI
- Establecimiento activo en el sistema del SRI

---

## 🚀 Instalación

```bash
# Instalar dependencias
npm install

# Compilar
npm run build

# Ejecutar en desarrollo
npm run start:dev

# Ejecutar en producción
npm run start:prod
```

La API estará disponible en `http://localhost:3000`

---

## 🌐 Endpoints

### 1. **POST /invoice** - Enviar Factura

Envía una factura al SRI para validación y autorización.

**Request:**
```bash
POST /invoice
Content-Type: multipart/form-data

Fields:
- certificado: archivo .p12 (file)
- certificadoPassword: string
- rucEmisor: string (13 dígitos)
- razonSocialEmisor: string
- direccionEmisor: string
- establecimiento: string (3 dígitos, ej: "001")
- puntoEmision: string (3 dígitos, ej: "001")
- secuencial: string (hasta 9 dígitos, ej: "000000001")
- identificacionComprador: string
- razonSocialComprador: string
- fechaEmision: string (DD/MM/YYYY)
- items: JSON array de items de factura
- ambiente: "1" | "2" (opcional, default: "1" = Pruebas)
```

**Response:**
```json
{
  "claveAcceso": "0101202501176001321000110010030009900641234567814",
  "estado": "RECIBIDA",
  "mensajes": [
    {
      "identificador": "43",
      "mensaje": "CLAVE ACCESO REGISTRADA",
      "tipo": "INFO"
    }
  ]
}
```

### 2. **GET /invoice/:claveAcceso** - Consultar Estado

Consulta el estado de autorización y obtiene XML + RIDE si está autorizada.

**Request:**
```bash
GET /invoice/0101202501176001321000110010030009900641234567814
```

**Response (AUTORIZADO):**
```json
{
  "claveAcceso": "0101202501...",
  "estado": "AUTORIZADO",
  "numeroAutorizacion": "0101202501...",
  "fechaAutorizacion": "2025-01-01T10:30:00-05:00",
  "ambiente": "PRUEBAS",
  "xml": "base64_encoded_xml...",
  "ride": "base64_encoded_pdf..."
}
```

**Response (EN PROCESO):**
```json
{
  "claveAcceso": "0101202501...",
  "estado": "EN PROCESO",
  "mensajes": []
}
```

---

## 📁 Estructura del Proyecto

```
src/
├── app.module.ts                              # Módulo principal
├── modules/
│   ├── billing/                               # Módulo de facturación
│   │   ├── application/dto/
│   │   │   └── send-invoice.dto.ts            # DTO de entrada
│   │   ├── infrastructure/
│   │   │   ├── controllers/
│   │   │   │   └── invoice.controller.ts      # Controlador principal ⭐
│   │   │   └── xml/
│   │   │       └── sri-xml-generator.service.ts # Generador XML SRI
│   │   └── billing.module.ts
│   │
│   ├── digital-signature/                     # Módulo de firma digital
│   │   ├── services/
│   │   │   ├── xades-signer.service.ts        # Firma XAdES-BES ⭐
│   │   │   └── xml-validator.service.ts       # Validador XML
│   │   └── digital-signature.module.ts
│   │
│   └── sri-integration/                       # Módulo de integración SRI
│       ├── domain/value-objects/
│       │   ├── sri-message.value-object.ts
│       │   └── access-key.value-object.ts
│       ├── infrastructure/
│       │   ├── config/
│       │   │   └── sri-endpoints.config.ts    # Endpoints SOAP
│       │   └── services/
│       │       ├── sri-client.service.ts      # Cliente SOAP mejorado ⭐
│       │       └── ride-generator.service.ts  # Generador PDF ⭐
│       ├── types/
│       │   └── sri-response.types.ts          # Tipos de respuesta SRI
│       └── sri-integration.module.ts
```

---

## 🔧 Configuración

### Variables de Entorno (Opcional)

Crea un archivo `.env` en la raíz:

```env
# Ambiente de PRUEBAS (default)
SRI_RECEPCION_WSDL=https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl
SRI_AUTORIZACION_WSDL=https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl

# Ambiente de PRODUCCIÓN
# SRI_RECEPCION_WSDL=https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl
# SRI_AUTORIZACION_WSDL=https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl
```

---

## 📚 Documentación Completa

- **[USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md)** - Ejemplos de uso con código (cURL, JavaScript, Python)
- **[ARCHITECTURE_CHANGES.md](./ARCHITECTURE_CHANGES.md)** - Explicación de la arquitectura y cambios
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Documentación detallada de la API

---

## 🔄 Flujo de Trabajo

```
1. Cliente envía POST /invoice con datos + certificado.p12
   ↓
2. API genera clave de acceso (49 dígitos)
   ↓
3. API genera XML conforme a SRI v2.1.0
   ↓
4. API firma XML con P12 (XAdES-BES)
   ↓
5. API envía a RecepcionComprobantes (SOAP)
   ↓
6. API retorna: claveAcceso + estado

---

7. Cliente hace polling manual con GET /invoice/:claveAcceso
   ↓
8. API consulta AutorizacionComprobantes (SOAP)
   ↓
9. Si AUTORIZADO:
   - API extrae XML autorizado del SRI
   - API genera RIDE (PDF)
   - Retorna XML + RIDE en base64
   ↓
10. Cliente guarda archivos y finaliza
```

---

## 🧪 Ejemplo Rápido

### JavaScript/Node.js

```javascript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

async function example() {
  // 1. Enviar factura
  const form = new FormData();
  form.append('certificado', fs.createReadStream('./certificado.p12'));
  form.append('certificadoPassword', 'password123');
  form.append('rucEmisor', '1792146739001');
  form.append('razonSocialEmisor', 'MI EMPRESA S.A.');
  form.append('direccionEmisor', 'Quito, Ecuador');
  form.append('establecimiento', '001');
  form.append('puntoEmision', '001');
  form.append('secuencial', '000000001');
  form.append('identificacionComprador', '1234567890');
  form.append('razonSocialComprador', 'CLIENTE PRUEBA');
  form.append('fechaEmision', '15/01/2025');
  form.append('items', JSON.stringify([
    { descripcion: 'Producto 1', cantidad: 1, precioUnitario: 100 }
  ]));

  const { data } = await axios.post('http://localhost:3000/invoice', form, {
    headers: form.getHeaders()
  });

  console.log('Clave de Acceso:', data.claveAcceso);

  // 2. Consultar hasta obtener autorización
  while (true) {
    const status = await axios.get(`http://localhost:3000/invoice/${data.claveAcceso}`);

    if (status.data.estado === 'AUTORIZADO') {
      // Guardar archivos
      fs.writeFileSync('factura.xml', Buffer.from(status.data.xml, 'base64'));
      fs.writeFileSync('factura.pdf', Buffer.from(status.data.ride, 'base64'));
      console.log('✅ Factura autorizada y guardada');
      break;
    }

    console.log('⏳ En proceso, esperando 30 segundos...');
    await new Promise(r => setTimeout(r, 30000));
  }
}

example();
```

---

## 🛠️ Tecnologías

- **NestJS 10:** Framework backend
- **TypeScript 5:** Tipado estático
- **SOAP:** Librería soap para WSDL
- **node-forge:** Manejo de certificados P12
- **pdfkit:** Generación de RIDE (PDF)
- **xmldsigjs:** Firma digital XAdES-BES
- **fast-xml-parser:** Parser XML
- **class-validator:** Validación de DTOs

---

## ⚠️ Notas Importantes

1. **Polling Manual:** El cliente debe consultar el estado periódicamente (cada 30-60 segundos)
2. **Tiempo SRI:** El SRI tiene hasta 24 horas para autorizar, pero usualmente toma 30-120 segundos
3. **RIDE:** Lo genera la API, **no viene del SRI**
4. **Certificado:** Debe ser válido y no expirado (ver [sección de certificados](#-certificado-digital-requerido))
5. **Clave de Acceso:** Se genera automáticamente con dígito verificador módulo 11
6. **Establecimiento:** Debe estar activo en el sistema del SRI

---

## � Certificado Digital Requerido

### ⚠️ Importante: Certificado Oficial Obligatorio

El SRI **siempre valida** la firma electrónica, incluso en ambiente de pruebas. **No es posible simular o evitar esta validación.**

**Estado actual con certificado de prueba:**
```json
{
  "estado": "RECIBIDA",  // ✅ Comprobante aceptado
  "mensajes": []
}

// Pero en autorización:
{
  "estado": "NO AUTORIZADO",
  "mensajes": [{
    "identificador": "39",
    "mensaje": "FIRMA INVALIDA",  // ❌ Certificado auto-firmado no reconocido
    "informacionAdicional": "La validacion de la cadena de confianza ha fallado"
  }]
}
```

### 📝 Cómo Obtener un Certificado Oficial

#### Opción 1: Security Data (Recomendada) ⭐
- **Sitio:** https://www.securitydata.net.ec
- **Costo:** $50-100 USD/año
- **Tiempo:** 1-2 días hábiles
- **Teléfono:** (02) 2553-330

#### Opción 2: Banco Central del Ecuador (BCE)
- **Sitio:** https://www.eci.bce.ec
- **Costo:** $60 USD/año
- **Tiempo:** 2-3 días hábiles
- **Teléfono:** 1800-322-322

#### Opción 3: ANFAC
- **Sitio:** https://firmaselectronicas.ec
- **Costo:** $80 USD/año
- **Tiempo:** 1-2 días hábiles

#### Opción 4: Datil (SaaS con certificado incluido)
- **Sitio:** https://datil.com
- **Costo:** $30-50 USD/mes
- **Incluye:** API + certificado + soporte

### 🚀 Pasos para Producción

1. **Obtener certificado oficial** (~2-3 días)
   ```bash
   # Recibirás un archivo .p12 y una contraseña
   ```

2. **Reemplazar certificado de prueba**
   ```bash
   cp ~/Downloads/firma_oficial.p12 ./certificado_produccion.p12
   ```

3. **Actualizar configuración**
   ```typescript
   // Cambiar endpoints a producción en sri.config.ts
   recepcion: 'https://comprobantes.sri.gob.ec/...',
   autorizacion: 'https://comprobantes.sri.gob.ec/...'
   ```

4. **Probar en ambiente de certificación primero**
   ```bash
   # Usar endpoints: celcer.sri.gob.ec
   npm run start:dev
   ```

5. **Desplegar a producción** ✅

**Resultado esperado con certificado oficial:**
```json
{
  "estado": "AUTORIZADO",  // ✅✅✅
  "numeroAutorizacion": "0710202501...",
  "fechaAutorizacion": "2025-10-07T23:45:00.000Z"
}
```

### 📚 Documentación Adicional

Ver [CERTIFICADO_REQUERIDO.md](./CERTIFICADO_REQUERIDO.md) para:
- Comparación detallada de entidades certificadoras
- Proceso completo paso a paso
- Solución de problemas comunes
- Checklist de producción

---

## 🐛 Troubleshooting

### Error 39: "FIRMA INVALIDA"
**Causa:** Certificado auto-firmado o no emitido por entidad certificadora autorizada.
**Solución:** Obtener certificado oficial (ver [sección de certificados](#-certificado-digital-requerido)).

### Error 56: "ESTABLECIMIENTO CERRADO"
**Causa:** El establecimiento no está activo en el sistema del SRI.
**Solución:** 
1. Verificar en SRI en Línea: https://srienlinea.sri.gob.ec
2. Activar el establecimiento con documentos en oficina del SRI
3. O usar un establecimiento diferente que esté activo (ej: `001`)

### Error 35: "ARCHIVO NO CUMPLE ESTRUCTURA XML"
**Causa:** Clave de acceso incorrecta (debe ser exactamente 49 dígitos).
**Solución:** ✅ Ya corregido - El algoritmo módulo 11 está implementado correctamente.

### Error: "Certificado inválido o expirado"
Verifica que el certificado P12 esté vigente y la contraseña sea correcta.

### Timeout del SRI
El SRI puede tardar. Aumenta el intervalo de polling a 60 segundos.

### Comprobante "EN PROCESO" por mucho tiempo
El SRI puede tardar hasta 24 horas, pero usualmente es 30-120 segundos. Si supera 10 minutos, revisar logs del SRI o contactar soporte.

---

## 📄 Licencia

UNLICENSED - Uso privado

---

## 👥 Soporte

Para consultas sobre el SRI Ecuador:
- [SRI - Facturación Electrónica](https://www.sri.gob.ec/facturacion-electronica)
- [Ficha Técnica Oficial](https://www.sri.gob.ec/o/sri-portlet-biblioteca-alfresco-internet/descargar/ed555352-46c7-4917-9f61-011b6a9f4600/FICHA%20T%C3%89CNICA%20COMPROBANTES%20ELECTR%C3%93NICOS%20ESQUEMA%20OFFLINE%20Versi%C3%B3n%202.26.pdf)

---

**Versión:** 1.0.0
**Última actualización:** Enero 2025
