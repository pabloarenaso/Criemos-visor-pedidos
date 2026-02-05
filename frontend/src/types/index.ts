// Shopify Order Types
export interface ShopifyOrder {
    id: number;
    order_number: number;
    name: string;
    email: string;
    created_at: string;
    updated_at: string;
    closed_at: string | null;
    cancelled_at: string | null;
    financial_status: string;
    fulfillment_status: string | null;
    currency: string;
    total_price: string;
    subtotal_price: string;
    total_tax: string;
    total_discounts: string;
    total_shipping_price_set: {
        shop_money: {
            amount: string;
            currency_code: string;
        };
    };
    customer: ShopifyCustomer | null;
    line_items: ShopifyLineItem[];
    shipping_address: ShopifyAddress | null;
    billing_address: ShopifyAddress | null;
    note: string | null;
    tags: string;
}

export interface ShopifyCustomer {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    orders_count: number;
    total_spent: string;
    created_at: string;
}

export interface ShopifyLineItem {
    id: number;
    title: string;
    quantity: number;
    price: string;
    sku: string;
    variant_title: string | null;
    product_id: number;
    variant_id: number;
}

export interface ShopifyAddress {
    first_name: string;
    last_name: string;
    address1: string;
    address2: string | null;
    city: string;
    province: string;
    country: string;
    zip: string;
    phone: string | null;
}

// Shopify Product Types
export interface ShopifyProduct {
    id: number;
    title: string;
    body_html: string;
    vendor: string;
    product_type: string;
    created_at: string;
    updated_at: string;
    published_at: string | null;
    status: string;
    tags: string;
    variants: ShopifyVariant[];
    images: ShopifyImage[];
    image: ShopifyImage | null;
}

export interface ShopifyVariant {
    id: number;
    product_id: number;
    title: string;
    price: string;
    sku: string;
    inventory_quantity: number;
    option1: string | null;
    option2: string | null;
    option3: string | null;
}

export interface ShopifyImage {
    id: number;
    product_id: number;
    src: string;
    alt: string | null;
    width: number;
    height: number;
}

// API Response Types
export interface ApiResponse<T> {
    data: T;
    error?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
