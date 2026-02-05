import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const {
  SHOPIFY_ACCESS_TOKEN,
  SHOPIFY_SHOP,
  SHOPIFY_API_VERSION,
  FRONTEND_URL
} = process.env;

// Validar variables de entorno
if (!SHOPIFY_ACCESS_TOKEN || !SHOPIFY_SHOP) {
  console.error('❌ Error: Faltan variables de entorno requeridas');
  console.error('Asegúrate de configurar SHOPIFY_ACCESS_TOKEN y SHOPIFY_SHOP en .env');
  process.exit(1);
}

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'https://visor-pedidos-criemos.loca.lt',
  process.env.FRONTEND_URL
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como Postman o curl)
    if (!origin) return callback(null, true);

    // Permitir localhost y dominios permitidos
    if (allowedOrigins.indexOf(origin) !== -1 ||
      origin.includes('.loca.lt') ||
      origin.includes('.ngrok-free.app') ||
      origin.includes('.serveousercontent.com') ||
      origin.includes('.localhost.run')) {
      callback(null, true);
    } else {
      console.log('Origin blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Función helper para llamadas a Shopify
async function shopifyRequest(endpoint, method = 'GET', body = null) {
  const url = `https://${SHOPIFY_SHOP}/admin/api/${SHOPIFY_API_VERSION}${endpoint}`;

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Shopify API Error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error en llamada a Shopify:', error);
    throw error;
  }
}

// ========================================
// ENDPOINTS - PEDIDOS
// ========================================

// Obtener todos los pedidos
app.get('/api/orders', async (req, res) => {
  try {
    const { status = 'any', limit = 250 } = req.query;
    const data = await shopifyRequest(`/orders.json?status=${status}&limit=${limit}`);

    // Formatear datos para el frontend
    const formattedOrders = data.orders.map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      name: order.name,
      createdAt: order.created_at,
      totalPrice: order.total_price,
      currency: order.currency,
      financialStatus: order.financial_status,
      fulfillmentStatus: order.fulfillment_status,
      customer: order.customer ? {
        id: order.customer.id,
        firstName: order.customer.first_name || '',
        lastName: order.customer.last_name || '',
        email: order.customer.email,
        phone: order.customer.phone,
        ordersCount: order.customer.orders_count
      } : null,
      shippingAddress: order.shipping_address,
      lineItems: order.line_items.map(item => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        variant: item.variant_title,
        sku: item.sku
      })),
      tags: order.tags
    }));

    res.json({
      success: true,
      count: formattedOrders.length,
      orders: formattedOrders
    });
  } catch (error) {
    console.error('Error obteniendo pedidos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener pedidos',
      message: error.message
    });
  }
});

// Obtener un pedido específico
app.get('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await shopifyRequest(`/orders/${id}.json`);
    const order = data.order;

    // Formatear el pedido igual que en el listado
    const formattedOrder = {
      id: order.id,
      orderNumber: order.order_number,
      name: order.name,
      createdAt: order.created_at,
      totalPrice: order.total_price,
      subtotalPrice: order.subtotal_price,
      totalShippingPrice: order.total_shipping_price_set?.shop_money?.amount || '0',
      totalTax: order.total_tax,
      totalDiscounts: order.total_discounts,
      currency: order.currency,
      financialStatus: order.financial_status,
      fulfillmentStatus: order.fulfillment_status,
      note: order.note,
      customer: order.customer ? {
        id: order.customer.id,
        firstName: order.customer.first_name,
        lastName: order.customer.last_name,
        email: order.customer.email,
        phone: order.customer.phone,
        ordersCount: order.customer.orders_count
      } : null,
      shippingAddress: order.shipping_address ? {
        firstName: order.shipping_address.first_name,
        lastName: order.shipping_address.last_name,
        address1: order.shipping_address.address1,
        address2: order.shipping_address.address2,
        city: order.shipping_address.city,
        province: order.shipping_address.province,
        country: order.shipping_address.country,
        zip: order.shipping_address.zip,
        phone: order.shipping_address.phone
      } : null,
      lineItems: order.line_items.map(item => ({
        id: item.id,
        title: item.title,
        variantTitle: item.variant_title,
        quantity: item.quantity,
        price: item.price,
        sku: item.sku
      })),
      fulfillments: order.fulfillments?.map(f => ({
        id: f.id,
        status: f.status,
        trackingNumber: f.tracking_number,
        trackingUrl: f.tracking_url,
        trackingCompany: f.tracking_company
      })) || [],
      tags: order.tags
    };

    res.json({
      success: true,
      order: formattedOrder
    });
  } catch (error) {
    console.error('Error obteniendo pedido:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener pedido',
      message: error.message
    });
  }
});

// ========================================
// ENDPOINTS - FULFILLMENT
// ========================================

// Obtener fulfillment orders de un pedido
app.get('/api/orders/:id/fulfillment-orders', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await shopifyRequest(`/orders/${id}/fulfillment_orders.json`);

    res.json({
      success: true,
      fulfillmentOrders: data.fulfillment_orders
    });
  } catch (error) {
    console.error('Error obteniendo fulfillment orders:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener fulfillment orders',
      message: error.message
    });
  }
});

// Marcar pedido como enviado
app.post('/api/orders/:id/fulfill', async (req, res) => {
  try {
    const { id } = req.params;
    const { trackingNumber, trackingUrl, trackingCompany } = req.body;

    // Primero obtener los fulfillment orders
    const fulfillmentOrdersData = await shopifyRequest(`/orders/${id}/fulfillment_orders.json`);
    const fulfillmentOrder = fulfillmentOrdersData.fulfillment_orders[0];

    if (!fulfillmentOrder) {
      throw new Error('No se encontró fulfillment order para este pedido');
    }

    // Crear el fulfillment
    const fulfillmentData = {
      fulfillment: {
        line_items_by_fulfillment_order: [
          {
            fulfillment_order_id: fulfillmentOrder.id
          }
        ],
        tracking_info: {
          number: trackingNumber,
          url: trackingUrl,
          company: trackingCompany
        },
        notify_customer: true
      }
    };

    const result = await shopifyRequest('/fulfillments.json', 'POST', fulfillmentData);

    res.json({
      success: true,
      message: 'Pedido marcado como enviado',
      fulfillment: result.fulfillment
    });
  } catch (error) {
    console.error('Error creando fulfillment:', error);
    res.status(500).json({
      success: false,
      error: 'Error al marcar pedido como enviado',
      message: error.message
    });
  }
});

// ========================================
// ENDPOINTS - PRODUCTOS
// ========================================

// Obtener productos
app.get('/api/products', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const data = await shopifyRequest(`/products.json?limit=${limit}`);

    const formattedProducts = data.products.map(product => ({
      id: product.id,
      title: product.title,
      vendor: product.vendor,
      productType: product.product_type,
      tags: product.tags,
      variants: product.variants.map(v => ({
        id: v.id,
        title: v.title,
        price: v.price,
        sku: v.sku,
        inventoryQuantity: v.inventory_quantity
      })),
      image: product.images[0]?.src
    }));

    res.json({
      success: true,
      count: formattedProducts.length,
      products: formattedProducts
    });
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener productos',
      message: error.message
    });
  }
});

// ========================================
// ENDPOINTS - CLIENTES
// ========================================

// Obtener clientes
app.get('/api/customers', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const data = await shopifyRequest(`/customers.json?limit=${limit}`);

    const formattedCustomers = data.customers.map(customer => ({
      id: customer.id,
      name: `${customer.first_name} ${customer.last_name}`,
      email: customer.email,
      phone: customer.phone,
      ordersCount: customer.orders_count,
      totalSpent: customer.total_spent,
      createdAt: customer.created_at
    }));

    res.json({
      success: true,
      count: formattedCustomers.length,
      customers: formattedCustomers
    });
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener clientes',
      message: error.message
    });
  }
});

// ========================================
// ENDPOINTS - UTILIDADES
// ========================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend funcionando correctamente',
    timestamp: new Date().toISOString(),
    shop: SHOPIFY_SHOP
  });
});

// Obtener información de la tienda
app.get('/api/shop', async (req, res) => {
  try {
    const data = await shopifyRequest('/shop.json');

    res.json({
      success: true,
      shop: {
        name: data.shop.name,
        email: data.shop.email,
        domain: data.shop.domain,
        currency: data.shop.currency,
        timezone: data.shop.timezone
      }
    });
  } catch (error) {
    console.error('Error obteniendo info de tienda:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener información de la tienda',
      message: error.message
    });
  }
});

// Servir archivos estáticos del frontend
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// Manejo de todas las rutas (SPA Support) - Debe ir al final
app.get('*', (req, res) => {
  console.log(`[SPA] Serving index.html for ${req.url}`);
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Backend de Shopify iniciado correctamente');
  console.log('='.repeat(60));
  console.log(`📍 Servidor: http://localhost:${PORT}`);
  console.log(`🏪 Tienda: ${SHOPIFY_SHOP}`);
  console.log(`✅ Token configurado: ${SHOPIFY_ACCESS_TOKEN.substring(0, 15)}...`);
  console.log('\n📋 Endpoints disponibles:');
  console.log('  GET  /api/health              - Estado del servidor');
  console.log('  GET  /api/shop                - Info de la tienda');
  console.log('  GET  /api/orders              - Listar pedidos');
  console.log('  GET  /api/orders/:id          - Pedido específico');
  console.log('  GET  /api/orders/:id/fulfillment-orders');
  console.log('  POST /api/orders/:id/fulfill  - Marcar como enviado');
  console.log('  GET  /api/products            - Listar productos');
  console.log('  GET  /api/customers           - Listar clientes');
  console.log('='.repeat(60) + '\n');
});
