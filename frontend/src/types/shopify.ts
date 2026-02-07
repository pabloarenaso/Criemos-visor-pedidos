// ============================================
// Shopify Types - Visor de Pedidos
// ============================================

// Dirección de envío
export interface ShippingAddress {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    province: string;
    provinceCode?: string;
    country: string;
    countryCode?: string;
    zip: string;
    phone?: string;
    company?: string;
}

// Cliente
export interface Customer {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    ordersCount: number;
    totalSpent: string;
    createdAt: string;
    updatedAt: string;
    tags?: string;
    note?: string;
    defaultAddress?: ShippingAddress;
}

// Item de línea (producto en un pedido)
export interface LineItem {
    id: number;
    productId: number;
    variantId: number;
    title: string;
    variantTitle?: string;
    sku?: string;
    quantity: number;
    price: string;
    totalDiscount: string;
    fulfillmentStatus?: 'fulfilled' | 'partial' | null;
    requiresShipping: boolean;
    grams: number;
    vendor?: string;
    properties?: Array<{ name: string; value: string }>;
}

// Información de fulfillment
export interface Fulfillment {
    id: number;
    orderId: number;
    status: 'pending' | 'open' | 'success' | 'cancelled' | 'error' | 'failure';
    createdAt: string;
    updatedAt: string;
    trackingCompany?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    lineItems: LineItem[];
}

// Pedido
export interface Order {
    id: number;
    orderNumber: number;
    name: string; // #1001, #1002, etc.
    email: string;
    createdAt: string;
    updatedAt: string;
    closedAt?: string;
    cancelledAt?: string;
    processedAt: string;

    // Estados
    financialStatus: 'pending' | 'authorized' | 'partially_paid' | 'paid' | 'partially_refunded' | 'refunded' | 'voided';
    fulfillmentStatus: 'fulfilled' | 'partial' | 'unfulfilled' | null;

    // Montos
    currency: string;
    totalPrice: string;
    subtotalPrice: string;
    totalTax: string;
    totalDiscounts: string;
    totalShippingPrice: string;

    // Relaciones
    customer: Customer | null;
    lineItems: LineItem[];
    shippingAddress: ShippingAddress | null;
    billingAddress?: ShippingAddress | null;
    fulfillments?: Fulfillment[];

    // Metadata
    note?: string;
    note_attributes?: Array<{ name: string; value: string }>;
    tags?: string;
    source?: string;
    gateway?: string;

    // Peso y envío
    totalWeight: number;
    shippingLines?: Array<{
        title: string;
        price: string;
        code: string;
    }>;
}

// Producto
export interface Product {
    id: number;
    title: string;
    bodyHtml?: string;
    vendor: string;
    productType: string;
    handle: string;
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
    status: 'active' | 'archived' | 'draft';
    tags: string;

    variants: ProductVariant[];
    images: ProductImage[];
    image?: ProductImage;

    options?: Array<{
        id: number;
        name: string;
        position: number;
        values: string[];
    }>;
}

export interface ProductVariant {
    id: number;
    productId: number;
    title: string;
    price: string;
    compareAtPrice?: string;
    sku?: string;
    barcode?: string;
    inventoryQuantity: number;
    inventoryPolicy: 'deny' | 'continue';
    weight: number;
    weightUnit: 'kg' | 'g' | 'lb' | 'oz';
    option1?: string;
    option2?: string;
    option3?: string;
    imageId?: number;
}

export interface ProductImage {
    id: number;
    productId: number;
    src: string;
    alt?: string;
    width: number;
    height: number;
    position: number;
}

// ============================================
// API Response Types
// ============================================

// Respuesta genérica del backend
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
}

// Respuesta de lista con paginación
export interface PaginatedApiResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

// Datos de tracking para fulfillment
export interface TrackingData {
    trackingNumber?: string;
    trackingCompany?: string;
    trackingUrl?: string;
    notifyCustomer?: boolean;
}

// Error del API
export interface ApiError {
    success: false;
    error: string;
    code?: string;
    details?: Record<string, unknown>;
}
