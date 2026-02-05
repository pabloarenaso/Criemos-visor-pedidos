# 🎨 Prompts para Antigravity - Frontend Shopify Orders

Estos prompts están diseñados para usar con Antigravity y construir la interfaz paso a paso.

---

## 📋 PROMPT 1: Configuración Inicial del Proyecto

```
Necesito configurar un proyecto React + TypeScript + Vite para visualizar pedidos de Shopify.

Requisitos técnicos:
- Vite + React 18 + TypeScript
- Tailwind CSS para estilos
- React Router para navegación
- Axios o fetch para llamadas HTTP

Estructura de carpetas deseada:
src/
├── components/     # Componentes reutilizables
├── pages/          # Páginas principales
├── services/       # Lógica de API
├── types/          # Tipos TypeScript
├── utils/          # Utilidades
└── App.tsx

Instala las dependencias necesarias y configura:
1. Tailwind CSS con configuración mobile-first
2. React Router con rutas para: Dashboard, Pedidos, Productos
3. Archivo de servicio API (src/services/api.ts) configurado para conectarse a http://localhost:3001

No crees componentes todavía, solo la estructura base y configuración.
```

---

## 📋 PROMPT 2: Tipos TypeScript y Servicio de API

```
Necesito crear los tipos TypeScript y el servicio de API para mi app de Shopify.

Contexto: Mi backend está en http://localhost:3001 y tiene estos endpoints:
- GET /api/orders - Lista de pedidos
- GET /api/orders/:id - Pedido específico
- POST /api/orders/:id/fulfill - Marcar como enviado
- GET /api/products - Productos
- GET /api/customers - Clientes

Crea:

1. Archivo src/types/shopify.ts con interfaces para:
   - Order (pedido con customer, lineItems, shippingAddress)
   - Product
   - Customer
   - LineItem
   - ShippingAddress
   - ApiResponse<T> (respuesta genérica del backend)

2. Archivo src/services/api.ts con:
   - Configuración base de axios/fetch para http://localhost:3001
   - Funciones async para cada endpoint:
     * getOrders(status?: string, limit?: number)
     * getOrderById(id: string)
     * fulfillOrder(id: string, trackingData)
     * getProducts()
     * getCustomers()
   - Manejo de errores con try/catch
   - Headers con Content-Type: application/json

Usa código limpio, tipado completo, y manejo de errores apropiado.
```

---

## 📋 PROMPT 3: Layout y Navegación

```
Necesito crear el layout principal y navegación para mi app de gestión de pedidos Shopify.

Crea:

1. Componente src/components/Layout.tsx con:
   - Sidebar izquierdo con navegación (Dashboard, Pedidos, Productos, Clientes)
   - Header superior con nombre de la tienda "Criemos"
   - Área de contenido principal para renderizar children
   - Diseño responsive (sidebar colapsable en móvil)
   - Estilos con Tailwind CSS

2. Componente src/components/Sidebar.tsx con:
   - Links de navegación usando React Router
   - Iconos para cada sección (usa lucide-react si está disponible)
   - Estado activo en el link actual
   - Transición suave al colapsar

3. Actualizar App.tsx con:
   - React Router configurado
   - Layout envolviendo todas las rutas
   - Rutas: / (dashboard), /pedidos, /productos, /clientes

Diseño moderno, profesional, colores neutros con acento azul/verde.
```

---

## 📋 PROMPT 4: Vista de Pedidos (Lista)

```
Necesito crear la vista principal de pedidos que muestre una tabla con todos los pedidos.

Crea src/pages/Pedidos.tsx con:

Funcionalidades:
- Fetch de pedidos desde el API al montar el componente (useEffect)
- Loading state mientras carga
- Tabla responsive con columnas:
  * Número de orden (#1234)
  * Cliente (nombre)
  * Fecha (formato DD/MM/YYYY)
  * Total (formato moneda CLP)
  * Estado financiero (badge con colores)
  * Estado de envío (badge con colores)
  * Acciones (botón Ver Detalle)

Componentes:
- Badge component reutilizable para estados (src/components/Badge.tsx)
- Card component para envolver la tabla (src/components/Card.tsx)

Estilos:
- Tabla con hover effects
- Badges de colores según estado:
  * paid: verde
  * pending: amarillo
  * refunded: rojo
  * fulfilled: azul
  * unfulfilled: gris
- Responsive: tabla scrollable en móvil
- Empty state si no hay pedidos

Manejo de errores:
- Mostrar mensaje si falla el fetch
- Loading skeleton mientras carga
```

---

## 📋 PROMPT 5: Vista de Detalle de Pedido

```
Necesito crear la vista de detalle individual de un pedido con opción para marcarlo como enviado.

Crea src/pages/PedidoDetalle.tsx con:

Funcionalidades:
- Obtener orderId de useParams (React Router)
- Fetch del pedido específico al montar
- Mostrar toda la información del pedido organizada en secciones:

Secciones del layout:
1. Header: Número de orden, fecha, estados (badges)
2. Información del cliente: nombre, email, teléfono
3. Dirección de envío: dirección completa formateada
4. Productos: tabla con productos, cantidades, precios
5. Totales: subtotal, envío, total
6. Sección de fulfillment:
   - Si NO está enviado: formulario para marcar como enviado
   - Si YA está enviado: mostrar info de tracking

Componente de formulario (src/components/FulfillmentForm.tsx):
- Inputs para:
  * Número de seguimiento
  * URL de seguimiento
  * Empresa de envío (select con opciones chilenas: Correos Chile, Chilexpress, Starken, BluExpress)
- Botón "Marcar como Enviado"
- POST a /api/orders/:id/fulfill
- Loading state durante el envío
- Success message después de enviar

Diseño:
- Cards separados para cada sección
- Botón de volver atrás
- Responsive
- Colores consistentes con el resto de la app
```

---

## 📋 PROMPT 6: Dashboard Principal

```
Necesito crear un dashboard principal con estadísticas y vista general de la tienda.

Crea src/pages/Dashboard.tsx con:

Contenido:
1. Grid de cards con estadísticas (usando los datos de pedidos):
   - Total de pedidos del mes
   - Pedidos pendientes de envío
   - Ingresos del mes (suma de pedidos pagados)
   - Clientes únicos

2. Tabla de "Pedidos Recientes" (últimos 10):
   - Mismo formato que la vista de pedidos pero limitado
   - Link "Ver todos" que redirige a /pedidos

3. Gráfico simple (opcional, si quieres puedes usar Chart.js o Recharts):
   - Pedidos por día de la última semana

Componentes:
- StatCard component (src/components/StatCard.tsx):
  * Icono
  * Título
  * Valor grande
  * Cambio porcentual (opcional)

Fetch de datos:
- Llamar a getOrders() al montar
- Calcular estadísticas en el cliente
- Filtrar por fecha para "del mes"

Diseño:
- Grid responsive (1 col móvil, 2 cols tablet, 4 cols desktop)
- Cards con shadow y hover effect
- Iconos con lucide-react
- Colores consistentes
```

---

## 📋 PROMPT 7: Vista de Productos (Opcional)

```
Necesito una vista simple de productos que muestre el inventario actual.

Crea src/pages/Productos.tsx con:

Funcionalidades:
- Fetch de productos desde el API
- Grid de cards de productos con:
  * Imagen del producto (o placeholder si no hay)
  * Título
  * Tipo de producto
  * Variantes con precios
  * Stock por variante
  * SKU

Características:
- Grid responsive (1-2-3-4 columnas según viewport)
- Buscador simple (filtro local por título)
- Badge para productos sin stock (rojo)
- Loading state
- Empty state si no hay productos

Diseño:

- Cards con imagen arriba
- Hover effect que eleva el card
- Tipografía clara
- Colores del tema
```

---

## 📋 PROMPT 8: Mejoras Finales y Pulido

```
Necesito pulir la aplicación con mejoras de UX y detalles finales.

Implementa:

1. Toast notifications (src/components/Toast.tsx):
   - Para success/error después de acciones
   - Posición top-right
   - Auto-dismiss después de 3 segundos
   - Usar en fulfillment y otras acciones

2. Loading skeletons (src/components/Skeleton.tsx):
   - Placeholders animados mientras cargan los datos
   - Usar en tablas y grids

3. Formateo de datos (src/utils/formatters.ts):
   - formatCurrency(amount: number, currency: string) → "$1.234.567 CLP"
   - formatDate(date: string) → "29 Ene 2026"
   - formatOrderNumber(number: number) → "#1234"

4. Error boundaries:
   - Componente ErrorBoundary para capturar errores de React
   - Página de error amigable

5. Mejoras responsive:
   - Revisar toda la app en mobile
   - Ajustar paddings y márgenes
   - Asegurar que todo sea usable en móvil

6. Favicon y título:
   - Cambiar título a "Criemos - Gestión de Pedidos"
   - Agregar favicon (puede ser una C estilizada)

Objetivo: App profesional, pulida, lista para producción.
```

---

## 🎯 Orden Sugerido de Implementación

1. ✅ Configuración inicial (estructura, dependencias, Tailwind)
2. ✅ Tipos y servicio de API (fundación del proyecto)
3. ✅ Layout y navegación (estructura visual)
4. ✅ Vista de pedidos - lista (funcionalidad principal)
5. ✅ Vista de detalle de pedido + fulfillment (funcionalidad core)
6. ✅ Dashboard (vista general)
7. ⚙️ Productos (opcional, según necesidad)
8. ✨ Mejoras finales (UX, polish, detalles)

---

## 💡 Tips para usar con Antigravity

- **Ejecuta un prompt a la vez** y revisa el resultado antes de continuar
- **Pide ajustes específicos** si algo no sale como esperabas
- **Menciona errores** que veas para que los corrija
- **Solicita explicaciones** si no entiendes algo del código generado
- **Itera** sobre el diseño hasta que te guste

---

## 🔗 Conexión Backend-Frontend

Recuerda que tu frontend llamará a:
```
http://localhost:3001/api/orders
http://localhost:3001/api/products
http://localhost:3001/api/customers
```

Asegúrate de tener el backend corriendo mientras desarrollas el frontend.

---

## 📦 Dependencias Sugeridas

```bash
npm install axios lucide-react date-fns
npm install -D @types/node
```

Opcionales para mejoras:
```bash
npm install recharts  # Para gráficos
npm install react-hot-toast  # Para notificaciones
```
