# Criemos - Visor de Pedidos

Sistema de gestión de pedidos de Shopify para la tienda Criemos.

## 📋 Descripción

Aplicación full-stack para visualizar y gestionar pedidos de Shopify:
- **Backend**: API REST con Express que se conecta a Shopify Admin API
- **Frontend**: Interfaz React + TypeScript + Vite para visualización

## 🏗️ Arquitectura

```
Criemos - Visor de Pedidos/
│
├── backend/          # API Express (Node.js)
│   ├── server.js
│   ├── package.json
│   └── .env         # Variables de entorno (NO subir a git)
│
└── frontend/        # App React + Vite + TypeScript
    ├── src/
    ├── public/
    └── package.json
```

## 🚀 Instalación

### Requisitos previos
- Node.js 18+ 
- npm o yarn
- Token de acceso de Shopify Admin API

### 1. Clonar el repositorio
```bash
git clone <tu-repo>
cd Criemos\ -\ Visor\ de\ Pedidos
```

### 2. Configurar Backend

```bash
cd backend
npm install
```

Crear archivo `.env` con:
```env
SHOPIFY_ACCESS_TOKEN=shpat_tu_token_aqui
SHOPIFY_SHOP=criemos.myshopify.com
PORT=3001
SHOPIFY_API_VERSION=2026-01
FRONTEND_URL=http://localhost:5173
```

### 3. Configurar Frontend

```bash
cd ../frontend
npm install
```

## 🎯 Desarrollo

### Arrancar ambos servidores

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```
→ Corre en `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
→ Corre en `http://localhost:5173`

## 📡 API Endpoints

El backend expone estos endpoints REST:

- `GET /api/health` - Estado del servidor
- `GET /api/shop` - Información de la tienda
- `GET /api/orders` - Lista de pedidos
- `GET /api/orders/:id` - Pedido específico
- `GET /api/orders/:id/fulfillment-orders` - Fulfillment orders
- `POST /api/orders/:id/fulfill` - Marcar como enviado
- `GET /api/products` - Lista de productos
- `GET /api/customers` - Lista de clientes

## 🔒 Seguridad

⚠️ **IMPORTANTE**: 
- El token de Shopify NUNCA debe exponerse en el frontend
- El archivo `.env` NO debe subirse a Git (ya está en .gitignore)
- Todas las llamadas a Shopify se hacen desde el backend
- El frontend solo consume la API del backend

## 🚢 Despliegue en Producción

### Backend (Servidor dedicado, Railway, Render, etc.)

1. Subir código del backend
2. Configurar variables de entorno en el servidor
3. Instalar dependencias: `npm install`
4. Iniciar con PM2 o similar:
```bash
pm2 start server.js --name shopify-backend
```

### Frontend (Vercel, Netlify, etc.)

1. Configurar build: `npm run build`
2. Output directory: `dist`
3. Actualizar URL del backend en el código

## 📝 Variables de Entorno

### Backend (.env)
```env
SHOPIFY_ACCESS_TOKEN=shpat_...
SHOPIFY_SHOP=criemos.myshopify.com
PORT=3001
SHOPIFY_API_VERSION=2026-01
FRONTEND_URL=https://tu-dominio-frontend.com
```

## 🛠️ Stack Tecnológico

### Backend
- Node.js
- Express
- node-fetch
- CORS
- dotenv

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router

## 📄 Licencia

Proyecto privado - Criemos

## 👤 Autor

Desarrollado para Criemos
