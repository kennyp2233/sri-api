# Documentación API - Integración Frontend

Esta guía está diseñada para desarrolladores frontend que necesitan integrar la facturación electrónica del SRI Ecuador en sus aplicaciones.

## 📋 Tabla de Contenidos

- [Endpoints Disponibles](#endpoints-disponibles)
- [Ejemplos de Integración](#ejemplos-de-integración)
- [Códigos y Catálogos SRI](#códigos-y-catálogos-sri)
- [Manejo de Errores](#manejo-de-errores)
- [Validaciones Requeridas](#validaciones-requeridas)

---

## 🔌 Endpoints Disponibles

### 1. Enviar Factura al SRI

**`POST /invoice`**

Envía una factura electrónica al SRI para su recepción y posterior autorización.

#### Request

- **Método:** POST
- **Content-Type:** `multipart/form-data`
- **Body Parameters:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `certificate` | File | ✅ | Archivo .p12 del certificado digital |
| `password` | String | ✅ | Contraseña del certificado |
| `data` | JSON | ✅ | Datos de la factura (ver estructura abajo) |

#### Estructura del JSON `data`:

```json
{
  "infoTributaria": {
    "ambiente": "1",
    "tipoEmision": "1",
    "razonSocial": "Mi Empresa S.A.",
    "nombreComercial": "Mi Empresa",
    "ruc": "1234567890001",
    "codDoc": "01",
    "estab": "001",
    "ptoEmi": "001",
    "secuencial": "000000001",
    "dirMatriz": "Av. Principal 123 y Calle Secundaria"
  },
  "infoFactura": {
    "fechaEmision": "07/10/2025",
    "dirEstablecimiento": "Av. Principal 123",
    "obligadoContabilidad": "SI",
    "tipoIdentificacionComprador": "05",
    "razonSocialComprador": "Cliente Ejemplo",
    "identificacionComprador": "1234567890",
    "totalSinImpuestos": "100.00",
    "totalDescuento": "0.00",
    "propina": "0.00",
    "importeTotal": "112.00",
    "moneda": "DOLAR",
    "pagos": [
      {
        "formaPago": "01",
        "total": "112.00"
      }
    ],
    "totalConImpuestos": [
      {
        "codigo": "2",
        "codigoPorcentaje": "2",
        "baseImponible": "100.00",
        "valor": "12.00"
      }
    ]
  },
  "detalles": [
    {
      "codigoPrincipal": "PROD001",
      "descripcion": "Producto de prueba",
      "cantidad": "1.00",
      "precioUnitario": "100.00",
      "descuento": "0.00",
      "precioTotalSinImpuesto": "100.00",
      "impuestos": [
        {
          "codigo": "2",
          "codigoPorcentaje": "2",
          "tarifa": "12",
          "baseImponible": "100.00",
          "valor": "12.00"
        }
      ]
    }
  ]
}
```

#### Response (Success - 201 Created)

```json
{
  "message": "Comprobante enviado al SRI con éxito",
  "claveAcceso": "0710202501123456789000110010010000000011234567818",
  "estado": "RECIBIDA"
}
```

#### Response (Error - 400/500)

```json
{
  "statusCode": 400,
  "message": "Descripción del error",
  "error": "Bad Request"
}
```

---

### 2. Consultar Autorización de Factura

**`GET /invoice/:claveAcceso`**

Consulta el estado de autorización de una factura previamente enviada.

#### Request

- **Método:** GET
- **URL Params:** `claveAcceso` (string de 49 dígitos)

**Ejemplo:**
```
GET /invoice/0710202501123456789000110010010000000011234567818
```

#### Response (Autorizada - 200 OK)

```json
{
  "estado": "AUTORIZADO",
  "numeroAutorizacion": "0710202501123456789000110010010000000011234567818",
  "fechaAutorizacion": "2025-10-07T14:30:25.000-05:00",
  "comprobante": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>...",
  "ride": "data:application/pdf;base64,JVBERi0xLjMK..."
}
```

#### Response (No Autorizada - 200 OK)

```json
{
  "estado": "RECIBIDA",
  "mensaje": "Comprobante recibido pero no autorizado aún"
}
```

#### Response (Error - 404)

```json
{
  "statusCode": 404,
  "message": "No se encontró autorización para esta clave de acceso",
  "error": "Not Found"
}
```

---

## 💻 Ejemplos de Integración

### JavaScript Vanilla (Fetch API)

```javascript
// Función para enviar factura
async function enviarFactura(certificateFile, password, facturaData) {
  const formData = new FormData();
  formData.append('certificate', certificateFile);
  formData.append('password', password);
  formData.append('data', JSON.stringify(facturaData));

  try {
    const response = await fetch('http://localhost:3000/invoice', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Factura enviada:', result);
    return result;
  } catch (error) {
    console.error('Error al enviar factura:', error);
    throw error;
  }
}

// Función para consultar autorización
async function consultarAutorizacion(claveAcceso) {
  try {
    const response = await fetch(`http://localhost:3000/invoice/${claveAcceso}`);
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error al consultar autorización:', error);
    throw error;
  }
}

// Uso
const fileInput = document.getElementById('certificate');
const certificateFile = fileInput.files[0];

const facturaData = {
  infoTributaria: {
    ambiente: '1',
    tipoEmision: '1',
    razonSocial: 'Mi Empresa S.A.',
    // ... resto de campos
  },
  infoFactura: {
    fechaEmision: '07/10/2025',
    // ... resto de campos
  },
  detalles: [
    // ... detalles de productos
  ]
};

// Enviar factura
const resultado = await enviarFactura(certificateFile, 'password123', facturaData);

// Consultar autorización después de unos segundos
setTimeout(async () => {
  const autorizacion = await consultarAutorizacion(resultado.claveAcceso);
  console.log('Estado:', autorizacion.estado);
}, 5000);
```

---

### React con Axios

```javascript
import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

function FacturaForm() {
  const [certificate, setCertificate] = useState(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('certificate', certificate);
    formData.append('password', password);
    
    const facturaData = {
      infoTributaria: {
        ambiente: '1',
        tipoEmision: '1',
        razonSocial: 'Mi Empresa S.A.',
        nombreComercial: 'Mi Empresa',
        ruc: '1234567890001',
        codDoc: '01',
        estab: '001',
        ptoEmi: '001',
        secuencial: '000000001',
        dirMatriz: 'Av. Principal 123'
      },
      infoFactura: {
        fechaEmision: new Date().toLocaleDateString('es-EC', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }),
        dirEstablecimiento: 'Av. Principal 123',
        obligadoContabilidad: 'SI',
        tipoIdentificacionComprador: '05',
        razonSocialComprador: 'Cliente Ejemplo',
        identificacionComprador: '1234567890',
        totalSinImpuestos: '100.00',
        totalDescuento: '0.00',
        propina: '0.00',
        importeTotal: '112.00',
        moneda: 'DOLAR',
        pagos: [{ formaPago: '01', total: '112.00' }],
        totalConImpuestos: [
          {
            codigo: '2',
            codigoPorcentaje: '2',
            baseImponible: '100.00',
            valor: '12.00'
          }
        ]
      },
      detalles: [
        {
          codigoPrincipal: 'PROD001',
          descripcion: 'Producto de prueba',
          cantidad: '1.00',
          precioUnitario: '100.00',
          descuento: '0.00',
          precioTotalSinImpuesto: '100.00',
          impuestos: [
            {
              codigo: '2',
              codigoPorcentaje: '2',
              tarifa: '12',
              baseImponible: '100.00',
              valor: '12.00'
            }
          ]
        }
      ]
    };

    formData.append('data', JSON.stringify(facturaData));

    try {
      const response = await axios.post(`${API_BASE_URL}/invoice`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setResultado(response.data);
      
      // Consultar autorización después de 5 segundos
      setTimeout(() => consultarAutorizacion(response.data.claveAcceso), 5000);
    } catch (error) {
      console.error('Error:', error.response?.data || error.message);
      alert('Error al enviar factura: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const consultarAutorizacion = async (claveAcceso) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/invoice/${claveAcceso}`);
      
      if (response.data.estado === 'AUTORIZADO') {
        alert('¡Factura autorizada!');
        
        // Descargar RIDE si está autorizada
        if (response.data.ride) {
          const link = document.createElement('a');
          link.href = response.data.ride;
          link.download = `factura_${claveAcceso}.pdf`;
          link.click();
        }
      } else {
        alert('Factura recibida pero no autorizada aún');
      }
    } catch (error) {
      console.error('Error al consultar:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Certificado Digital (.p12):</label>
        <input
          type="file"
          accept=".p12,.pfx"
          onChange={(e) => setCertificate(e.target.files[0])}
          required
        />
      </div>
      
      <div>
        <label>Contraseña del Certificado:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Enviando...' : 'Enviar Factura'}
      </button>

      {resultado && (
        <div>
          <h3>Resultado:</h3>
          <p>Clave de Acceso: {resultado.claveAcceso}</p>
          <p>Estado: {resultado.estado}</p>
        </div>
      )}
    </form>
  );
}

export default FacturaForm;
```

---

### Angular (TypeScript)

```typescript
// factura.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FacturaData {
  infoTributaria: any;
  infoFactura: any;
  detalles: any[];
}

export interface FacturaResponse {
  message: string;
  claveAcceso: string;
  estado: string;
}

export interface AutorizacionResponse {
  estado: string;
  numeroAutorizacion?: string;
  fechaAutorizacion?: string;
  comprobante?: string;
  ride?: string;
  mensaje?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FacturaService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  enviarFactura(
    certificate: File,
    password: string,
    data: FacturaData
  ): Observable<FacturaResponse> {
    const formData = new FormData();
    formData.append('certificate', certificate);
    formData.append('password', password);
    formData.append('data', JSON.stringify(data));

    return this.http.post<FacturaResponse>(`${this.apiUrl}/invoice`, formData);
  }

  consultarAutorizacion(claveAcceso: string): Observable<AutorizacionResponse> {
    return this.http.get<AutorizacionResponse>(
      `${this.apiUrl}/invoice/${claveAcceso}`
    );
  }
}

// factura.component.ts
import { Component } from '@angular/core';
import { FacturaService, FacturaData } from './factura.service';

@Component({
  selector: 'app-factura',
  templateUrl: './factura.component.html'
})
export class FacturaComponent {
  certificate: File | null = null;
  password = '';
  loading = false;
  resultado: any = null;

  constructor(private facturaService: FacturaService) {}

  onFileSelected(event: any) {
    this.certificate = event.target.files[0];
  }

  enviarFactura() {
    if (!this.certificate) return;

    this.loading = true;

    const facturaData: FacturaData = {
      infoTributaria: {
        ambiente: '1',
        tipoEmision: '1',
        razonSocial: 'Mi Empresa S.A.',
        nombreComercial: 'Mi Empresa',
        ruc: '1234567890001',
        codDoc: '01',
        estab: '001',
        ptoEmi: '001',
        secuencial: '000000001',
        dirMatriz: 'Av. Principal 123'
      },
      infoFactura: {
        fechaEmision: new Date().toLocaleDateString('es-EC'),
        dirEstablecimiento: 'Av. Principal 123',
        obligadoContabilidad: 'SI',
        tipoIdentificacionComprador: '05',
        razonSocialComprador: 'Cliente Ejemplo',
        identificacionComprador: '1234567890',
        totalSinImpuestos: '100.00',
        totalDescuento: '0.00',
        propina: '0.00',
        importeTotal: '112.00',
        moneda: 'DOLAR',
        pagos: [{ formaPago: '01', total: '112.00' }],
        totalConImpuestos: [
          {
            codigo: '2',
            codigoPorcentaje: '2',
            baseImponible: '100.00',
            valor: '12.00'
          }
        ]
      },
      detalles: [
        {
          codigoPrincipal: 'PROD001',
          descripcion: 'Producto de prueba',
          cantidad: '1.00',
          precioUnitario: '100.00',
          descuento: '0.00',
          precioTotalSinImpuesto: '100.00',
          impuestos: [
            {
              codigo: '2',
              codigoPorcentaje: '2',
              tarifa: '12',
              baseImponible: '100.00',
              valor: '12.00'
            }
          ]
        }
      ]
    };

    this.facturaService.enviarFactura(this.certificate, this.password, facturaData)
      .subscribe({
        next: (response) => {
          this.resultado = response;
          this.loading = false;
          
          // Consultar autorización después de 5 segundos
          setTimeout(() => {
            this.consultarAutorizacion(response.claveAcceso);
          }, 5000);
        },
        error: (error) => {
          console.error('Error:', error);
          this.loading = false;
          alert('Error al enviar factura: ' + error.error?.message);
        }
      });
  }

  consultarAutorizacion(claveAcceso: string) {
    this.facturaService.consultarAutorizacion(claveAcceso)
      .subscribe({
        next: (response) => {
          console.log('Estado de autorización:', response);
          
          if (response.estado === 'AUTORIZADO' && response.ride) {
            this.descargarPDF(response.ride, claveAcceso);
          }
        },
        error: (error) => {
          console.error('Error al consultar:', error);
        }
      });
  }

  descargarPDF(rideBase64: string, claveAcceso: string) {
    const link = document.createElement('a');
    link.href = rideBase64;
    link.download = `factura_${claveAcceso}.pdf`;
    link.click();
  }
}
```

---

### Vue 3 (Composition API)

```vue
<template>
  <div class="factura-form">
    <h2>Enviar Factura al SRI</h2>
    
    <form @submit.prevent="enviarFactura">
      <div class="form-group">
        <label>Certificado Digital (.p12):</label>
        <input
          type="file"
          accept=".p12,.pfx"
          @change="onFileChange"
          required
        />
      </div>
      
      <div class="form-group">
        <label>Contraseña:</label>
        <input
          type="password"
          v-model="password"
          required
        />
      </div>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Enviando...' : 'Enviar Factura' }}
      </button>
    </form>

    <div v-if="resultado" class="resultado">
      <h3>Resultado:</h3>
      <p><strong>Clave de Acceso:</strong> {{ resultado.claveAcceso }}</p>
      <p><strong>Estado:</strong> {{ resultado.estado }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

const certificate = ref(null);
const password = ref('');
const loading = ref(false);
const resultado = ref(null);

const onFileChange = (event) => {
  certificate.value = event.target.files[0];
};

const enviarFactura = async () => {
  loading.value = true;

  const formData = new FormData();
  formData.append('certificate', certificate.value);
  formData.append('password', password.value);
  
  const facturaData = {
    infoTributaria: {
      ambiente: '1',
      tipoEmision: '1',
      razonSocial: 'Mi Empresa S.A.',
      nombreComercial: 'Mi Empresa',
      ruc: '1234567890001',
      codDoc: '01',
      estab: '001',
      ptoEmi: '001',
      secuencial: '000000001',
      dirMatriz: 'Av. Principal 123'
    },
    infoFactura: {
      fechaEmision: new Date().toLocaleDateString('es-EC'),
      dirEstablecimiento: 'Av. Principal 123',
      obligadoContabilidad: 'SI',
      tipoIdentificacionComprador: '05',
      razonSocialComprador: 'Cliente Ejemplo',
      identificacionComprador: '1234567890',
      totalSinImpuestos: '100.00',
      totalDescuento: '0.00',
      propina: '0.00',
      importeTotal: '112.00',
      moneda: 'DOLAR',
      pagos: [{ formaPago: '01', total: '112.00' }],
      totalConImpuestos: [
        {
          codigo: '2',
          codigoPorcentaje: '2',
          baseImponible: '100.00',
          valor: '12.00'
        }
      ]
    },
    detalles: [
      {
        codigoPrincipal: 'PROD001',
        descripcion: 'Producto de prueba',
        cantidad: '1.00',
        precioUnitario: '100.00',
        descuento: '0.00',
        precioTotalSinImpuesto: '100.00',
        impuestos: [
          {
            codigo: '2',
            codigoPorcentaje: '2',
            tarifa: '12',
            baseImponible: '100.00',
            valor: '12.00'
          }
        ]
      }
    ]
  };

  formData.append('data', JSON.stringify(facturaData));

  try {
    const response = await axios.post(`${API_BASE_URL}/invoice`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    resultado.value = response.data;
    
    // Consultar autorización después de 5 segundos
    setTimeout(() => consultarAutorizacion(response.data.claveAcceso), 5000);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    alert('Error al enviar factura: ' + (error.response?.data?.message || error.message));
  } finally {
    loading.value = false;
  }
};

const consultarAutorizacion = async (claveAcceso) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/invoice/${claveAcceso}`);
    
    if (response.data.estado === 'AUTORIZADO') {
      alert('¡Factura autorizada!');
      
      if (response.data.ride) {
        const link = document.createElement('a');
        link.href = response.data.ride;
        link.download = `factura_${claveAcceso}.pdf`;
        link.click();
      }
    }
  } catch (error) {
    console.error('Error al consultar:', error);
  }
};
</script>
```

---

## 📚 Códigos y Catálogos SRI

### Tipos de Identificación (`tipoIdentificacionComprador`)

| Código | Descripción |
|--------|-------------|
| `04` | RUC |
| `05` | Cédula |
| `06` | Pasaporte |
| `07` | Consumidor Final |
| `08` | Identificación del Exterior |

### Formas de Pago (`formaPago`)

| Código | Descripción |
|--------|-------------|
| `01` | Sin utilización del sistema financiero |
| `15` | Compensación de deudas |
| `16` | Tarjeta de débito |
| `17` | Dinero electrónico |
| `18` | Tarjeta prepago |
| `19` | Tarjeta de crédito |
| `20` | Otros con utilización del sistema financiero |
| `21` | Endoso de títulos |

### Códigos de Impuestos

#### IVA (`codigo: "2"`)

| `codigoPorcentaje` | Tarifa | Descripción |
|-------------------|--------|-------------|
| `0` | 0% | IVA 0% |
| `2` | 12% | IVA 12% |
| `3` | 14% | IVA 14% |
| `4` | 15% | IVA 15% |
| `6` | No Objeto de Impuesto | No aplica IVA |
| `7` | Exento de IVA | Exento |
| `8` | 8% | IVA 8% |

#### ICE (`codigo: "3"`)

Impuesto a los Consumos Especiales - Las tarifas varían según el producto.

### Ambientes

| Código | Descripción |
|--------|-------------|
| `1` | Pruebas |
| `2` | Producción |

### Tipos de Emisión

| Código | Descripción |
|--------|-------------|
| `1` | Emisión Normal |
| `2` | Emisión por Indisponibilidad |

---

## ⚠️ Manejo de Errores

### Errores Comunes del SRI

| Error | Descripción | Solución |
|-------|-------------|----------|
| Error 39 | Firma digital inválida | Usar certificado oficial emitido por entidad certificadora autorizada |
| Error 43 | Clave de acceso no válida | Verificar algoritmo módulo 11 del dígito verificador |
| Error 56 | Establecimiento cerrado | Activar establecimiento en el SRI o usar uno activo (001) |
| Error 69 | Secuencial duplicado | Verificar que el número secuencial no haya sido usado |
| Error 70 | Comprobante ya existe | El comprobante ya fue enviado previamente |

### Validaciones del Cliente

```javascript
// Validar RUC (13 dígitos)
function validarRUC(ruc) {
  return /^\d{13}$/.test(ruc) && ruc.endsWith('001');
}

// Validar Cédula (10 dígitos)
function validarCedula(cedula) {
  if (!/^\d{10}$/.test(cedula)) return false;
  
  const digitos = cedula.split('').map(Number);
  const verificador = digitos.pop();
  
  const suma = digitos.reduce((acc, digito, index) => {
    let valor = digito * (index % 2 === 0 ? 2 : 1);
    return acc + (valor > 9 ? valor - 9 : valor);
  }, 0);
  
  const calculado = (10 - (suma % 10)) % 10;
  return calculado === verificador;
}

// Validar formato de fecha (dd/mm/yyyy)
function validarFecha(fecha) {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(fecha);
}

// Validar montos (2 decimales)
function validarMonto(monto) {
  return /^\d+\.\d{2}$/.test(monto);
}

// Validar secuencial (9 dígitos, padding con ceros)
function formatearSecuencial(numero) {
  return numero.toString().padStart(9, '0');
}

// Validar establecimiento y punto de emisión (3 dígitos)
function formatearEstablecimiento(numero) {
  return numero.toString().padStart(3, '0');
}
```

---

## ✅ Validaciones Requeridas

### Antes de Enviar la Factura

1. **Validar Identificación del Comprador:**
   - RUC: 13 dígitos terminados en 001
   - Cédula: 10 dígitos con algoritmo de validación
   - Pasaporte: Alfanumérico

2. **Validar Totales:**
   ```javascript
   const calcularTotales = (detalles) => {
     const subtotal = detalles.reduce((sum, d) => 
       sum + parseFloat(d.precioTotalSinImpuesto), 0
     );
     
     const totalImpuestos = detalles.reduce((sum, d) => 
       sum + d.impuestos.reduce((s, i) => s + parseFloat(i.valor), 0), 0
     );
     
     const total = subtotal + totalImpuestos;
     
     return {
       subtotal: subtotal.toFixed(2),
       totalImpuestos: totalImpuestos.toFixed(2),
       total: total.toFixed(2)
     };
   };
   ```

3. **Validar Formato de Fecha:**
   ```javascript
   const formatearFecha = (date) => {
     const d = new Date(date);
     const dia = String(d.getDate()).padStart(2, '0');
     const mes = String(d.getMonth() + 1).padStart(2, '0');
     const anio = d.getFullYear();
     return `${dia}/${mes}/${anio}`;
   };
   ```

4. **Validar Certificado:**
   - Formato: .p12 o .pfx
   - No expirado
   - Emitido por entidad certificadora autorizada

### Polling de Autorización

El SRI puede tardar varios segundos en autorizar un comprobante. Implementar polling:

```javascript
async function esperarAutorizacion(claveAcceso, maxIntentos = 10, intervalo = 3000) {
  for (let i = 0; i < maxIntentos; i++) {
    const response = await consultarAutorizacion(claveAcceso);
    
    if (response.estado === 'AUTORIZADO') {
      return response;
    }
    
    if (response.estado === 'NO AUTORIZADO') {
      throw new Error('Comprobante rechazado por el SRI');
    }
    
    // Esperar antes del siguiente intento
    await new Promise(resolve => setTimeout(resolve, intervalo));
  }
  
  throw new Error('Timeout esperando autorización');
}
```

---

## 🔐 Seguridad

### Recomendaciones

1. **No almacenar certificados en el frontend:**
   - El archivo .p12 debe ser seleccionado por el usuario cada vez
   - O almacenado de forma segura en el backend

2. **Contraseñas:**
   - Nunca almacenar en localStorage o código
   - Usar inputs tipo `password`
   - Limpiar de memoria después de usar

3. **HTTPS:**
   - Siempre usar HTTPS en producción
   - El certificado digital viaja en la petición

4. **Variables de entorno:**
   ```javascript
   const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
   const AMBIENTE = process.env.REACT_APP_AMBIENTE || '1'; // 1=pruebas, 2=producción
   ```

---

## 📦 Ejemplo Completo de Flujo

```javascript
// 1. Capturar datos del formulario
const facturaData = construirFactura(formulario);

// 2. Validar antes de enviar
if (!validarFactura(facturaData)) {
  alert('Datos inválidos');
  return;
}

// 3. Enviar al backend
const resultado = await enviarFactura(certificate, password, facturaData);
console.log('Clave de acceso:', resultado.claveAcceso);

// 4. Polling de autorización (cada 3 segundos, máximo 10 intentos)
const autorizacion = await esperarAutorizacion(resultado.claveAcceso, 10, 3000);

// 5. Descargar RIDE si está autorizada
if (autorizacion.estado === 'AUTORIZADO') {
  descargarPDF(autorizacion.ride, resultado.claveAcceso);
  alert('¡Factura autorizada!');
} else {
  alert('Factura no autorizada: ' + autorizacion.mensaje);
}
```

---

## 📞 Soporte

Para más información sobre los requisitos del SRI:
- **Portal SRI:** https://www.sri.gob.ec
- **Documentación Técnica:** https://www.sri.gob.ec/facturacion-electronica

Para problemas con esta API:
- Revisar logs del backend
- Verificar certificado digital
- Consultar estado del servicio SRI: https://srienlinea.sri.gob.ec/

---

## 📝 Notas Importantes

1. **Ambiente de Pruebas:**
   - Usar `ambiente: "1"` en `infoTributaria`
   - El SRI puede rechazar comprobantes de prueba con ciertos RUCs
   - Certificados de prueba pueden generar Error 39

2. **Producción:**
   - Cambiar a `ambiente: "2"`
   - Usar certificado oficial
   - Verificar que el establecimiento esté activo

3. **Secuenciales:**
   - Mantener control estricto de secuenciales
   - No reutilizar números
   - Formato: 9 dígitos con ceros a la izquierda

4. **Tiempos de Respuesta:**
   - Recepción: 1-3 segundos
   - Autorización: 3-10 segundos
   - En horarios pico puede tardar más

5. **Clave de Acceso:**
   - 49 dígitos generados automáticamente por el backend
   - Incluye dígito verificador calculado con módulo 11
   - Sirve como identificador único del comprobante
