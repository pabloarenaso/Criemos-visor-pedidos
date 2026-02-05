# Backend Shopify Orders - API REST

Backend Express para gestionar pedidos de Shopify con tu token de Admin API.

## 🚀 Instalación

1. **Instalar dependencias:**
```bash
npm install
```

2. **Configurar variables de entorno:**
Edita el archivo `.env` y pega tu token:
```env
SHOPIFY_ACCESS_TOKEN=shpat_TU_TOKEN_AQUI
SHOPIFY_SHOP=criemos.myshopify.com
PORT=3001
FRONTEND_URL=http://localhost:5173
```

3. **Iniciar el servidor:**
```bash
npm start
```

O en modo desarrollo (con auto-reload):
```bash
npm run dev
```

## 📡 Endpoints Disponibles

### Health Check
```bash
GET /api/health
```
Respuesta:
```json
{
  "success": true,
  "message": "Backend funcionando correctamente",
  "timestamp": "2026-01-29T...",
  "shop": "criemos.myshopify.com"
}
```

### Información de la Tienda
```bash
GET /api/shop
```

### Pedidos

**Listar todos los pedidos:**
```bash
GET /api/orders?status=any&limit=50
```

Parámetros query:
- `status`: `any`, `open`, `closed` (default: `any`)
- `limit`: número de pedidos (default: `50`)

**Obtener un pedido específico:**
```bash
GET /api/orders/:id
```

**Obtener fulfillment orders:**
```bash
GET /api/orders/:id/fulfillment-orders
```

**Marcar pedido como enviado:**
```bash
POST /api/orders/:id/fulfill
Content-Type: application/json

{
  "trackingNumber": "123456789",
  "trackingUrl": "https://tracking.com/123456789",
  "trackingCompany": "Correos Chile"
}
```

### Productos

**Listar productos:**
```bash
GET /api/products?limit=50
```

### Clientes

**Listar clientes:**
```bash
GET /api/customers?limit=50
```

## 🔒 Seguridad

- ⚠️ **NUNCA** compartas el token de Shopify
- ⚠️ El token está en `.env` (NO subir a git)
- ✅ CORS configurado solo para tu frontend
- ✅ Token usado solo en el backend

## 🧪 Probar el Backend

### Con curl:
```bash
# Health check
curl http://localhost:3001/api/health

# Obtener pedidos
curl http://localhost:3001/api/orders
```

### Con el navegador:
Abre: `http://localhost:3001/api/health`

## 📁 Estructura del Proyecto

```
shopify-backend/
├── .env              # Variables de entorno (NO subir a git)
├── package.json      # Dependencias
├── server.js         # Servidor Express
└── README.md         # Este archivo
```

## 🚢 Despliegue en Servidor Dedicado

1. **Subir archivos al servidor** (sin .env)
2. **Instalar dependencias:** `npm install`
3. **Configurar .env** en el servidor con tu token
4. **Iniciar con PM2 o similar:**
```bash
pm2 start server.js --name shopify-backend
```

## 🔗 Conectar con Frontend React

Tu app React debe llamar a estos endpoints:

```typescript
// Ejemplo en React
const response = await fetch('http://localhost:3001/api/orders');
const data = await response.json();
console.log(data.orders);
```

## 📝 Notas

- El backend formatea los datos de Shopify para que sean más fáciles de usar en el frontend
- Todos los endpoints retornan JSON con estructura consistente:
```json
{
  "success": true/false,
  "data": {...},
  "error": "mensaje de error si aplica"
}
```
