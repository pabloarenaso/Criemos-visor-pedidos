import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type {
    Order,
    Product,
    Customer,
    TrackingData,
} from '../types/shopify';

// ============================================
// API Configuration
// ============================================

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

console.log('[API] Base URL:', API_BASE_URL);

// Create Axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'ngrok-skip-browser-warning': 'true',
    },
});

// ============================================
// Backend Response Types (actual format from server.js)
// ============================================

interface OrdersResponse {
    success: boolean;
    count: number;
    orders: Order[];
    error?: string;
}

interface SingleOrderResponse {
    success: boolean;
    order: Order;
    error?: string;
}

interface ProductsResponse {
    success: boolean;
    count: number;
    products: Product[];
    error?: string;
}

interface CustomersResponse {
    success: boolean;
    count: number;
    customers: Customer[];
    error?: string;
}

interface FulfillmentResponse {
    success: boolean;
    message: string;
    fulfillment: unknown;
    error?: string;
}

// ============================================
// Error Handling
// ============================================

interface ApiError {
    success: boolean;
    error: string;
    message?: string;
}

function handleApiError(error: unknown): never {
    console.error('[API] Error caught:', error);

    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;

        if (axiosError.response) {
            // Server responded with error
            const serverError = axiosError.response.data;
            console.error('[API] Server Error:', axiosError.response.status, serverError);
            throw new Error(serverError?.error || serverError?.message || `Error ${axiosError.response.status}`);
        } else if (axiosError.request) {
            // No response received
            console.error('[API] Network Error - No response:', axiosError.message);
            throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.');
        }
    }

    console.error('[API] Unexpected Error:', error);
    throw new Error(error instanceof Error ? error.message : 'Error desconocido');
}

// ============================================
// Orders API
// ============================================

/**
 * Obtiene la lista de pedidos
 */
export async function getOrders(
    status?: string,
    limit?: number
): Promise<{ data: Order[] }> {
    console.log('[API] Fetching orders...');

    try {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        if (limit) params.append('limit', limit.toString());

        const queryString = params.toString();
        const url = `/api/orders${queryString ? `?${queryString}` : ''}`;

        console.log('[API] GET', url);

        const response = await apiClient.get<OrdersResponse>(url);

        console.log('[API] Orders response:', response.data);
        console.log('[API] Orders count:', response.data.orders?.length);

        // Transform to expected format
        return { data: response.data.orders || [] };
    } catch (error) {
        handleApiError(error);
    }
}

/**
 * Obtiene un pedido específico por ID
 */
export async function getOrderById(id: string): Promise<{ data: Order }> {
    console.log('[API] Fetching order:', id);

    try {
        const response = await apiClient.get<SingleOrderResponse>(`/api/orders/${id}`);

        console.log('[API] Order response:', response.data);

        return { data: response.data.order };
    } catch (error) {
        handleApiError(error);
    }
}

/**
 * Marca un pedido como enviado (fulfill)
 */
export async function fulfillOrder(
    id: string,
    trackingData: TrackingData
): Promise<{ success: boolean; message: string }> {
    console.log('[API] Fulfilling order:', id, trackingData);

    try {
        const response = await apiClient.post<FulfillmentResponse>(
            `/api/orders/${id}/fulfill`,
            trackingData
        );

        console.log('[API] Fulfill response:', response.data);

        return {
            success: response.data.success,
            message: response.data.message
        };
    } catch (error) {
        handleApiError(error);
    }
}

// ============================================
// Products API
// ============================================

/**
 * Obtiene la lista de productos
 */
export async function getProducts(): Promise<{ data: Product[] }> {
    console.log('[API] Fetching products...');

    try {
        const response = await apiClient.get<ProductsResponse>('/api/products');

        console.log('[API] Products response:', response.data);
        console.log('[API] Products count:', response.data.products?.length);

        return { data: response.data.products || [] };
    } catch (error) {
        handleApiError(error);
    }
}

// ============================================
// Customers API
// ============================================

/**
 * Obtiene la lista de clientes
 */
export async function getCustomers(): Promise<{ data: Customer[] }> {
    console.log('[API] Fetching customers...');

    try {
        const response = await apiClient.get<CustomersResponse>('/api/customers');

        console.log('[API] Customers response:', response.data);
        console.log('[API] Customers count:', response.data.customers?.length);

        return { data: response.data.customers || [] };
    } catch (error) {
        handleApiError(error);
    }
}

// ============================================
// Debug: Direct fetch test
// ============================================

export async function testDirectFetch(): Promise<void> {
    console.log('[API] Testing direct fetch to', API_BASE_URL);

    try {
        const response = await fetch(`${API_BASE_URL}/api/orders`);
        const data = await response.json();
        console.log('[API] Direct fetch result:', data);
    } catch (error) {
        console.error('[API] Direct fetch error:', error);
    }
}

// ============================================
// API Client Export
// ============================================

export const ordersApi = {
    getAll: getOrders,
    getById: getOrderById,
    fulfill: fulfillOrder,
};

export const productsApi = {
    getAll: getProducts,
};

export const customersApi = {
    getAll: getCustomers,
};

export { apiClient };

export default {
    orders: ordersApi,
    products: productsApi,
    customers: customersApi,
    testDirectFetch,
};
