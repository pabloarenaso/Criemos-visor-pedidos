import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    User,
    MapPin,
    Truck,
    ExternalLink,
    Calendar,
    Mail,
    Phone,
    AlertCircle,
} from 'lucide-react';
import { getOrderById } from '../services/api';
import type { Order } from '../types/shopify';
import Card, { CardHeader } from '../components/Card';
import Badge, {
    getFinancialStatusVariant,
    getFulfillmentStatusVariant,
    translateFinancialStatus,
    translateFulfillmentStatus,
} from '../components/Badge';
import FulfillmentForm from '../components/FulfillmentForm';

// Format date with time
function formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

// Format currency to CLP
function formatCurrency(amount: string): string {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num);
}

// Loading skeleton component
function LoadingSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl p-6 h-48"></div>
                    <div className="bg-white rounded-xl p-6 h-64"></div>
                </div>
                <div className="space-y-6">
                    <div className="bg-white rounded-xl p-6 h-40"></div>
                    <div className="bg-white rounded-xl p-6 h-40"></div>
                </div>
            </div>
        </div>
    );
}

export default function PedidoDetalle() {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrder = async () => {
        if (!orderId) return;

        try {
            setLoading(true);
            setError(null);
            const response = await getOrderById(orderId);
            setOrder(response.data);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error al cargar el pedido';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrder();
    }, [orderId]);

    const handleFulfillmentSuccess = () => {
        // Refresh order data after successful fulfillment
        fetchOrder();
    };

    // Loading state
    if (loading) {
        return (
            <div className="space-y-6">
                <button
                    onClick={() => navigate('/pedidos')}
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Volver a Pedidos
                </button>
                <LoadingSkeleton />
            </div>
        );
    }

    // Error state
    if (error || !order) {
        return (
            <div className="space-y-6">
                <button
                    onClick={() => navigate('/pedidos')}
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Volver a Pedidos
                </button>

                <Card padding="lg">
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle size={32} className="text-red-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-800 mb-2">Error al cargar el pedido</h3>
                        <p className="text-gray-500 max-w-sm mb-4">{error || 'Pedido no encontrado'}</p>
                        <button
                            onClick={fetchOrder}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                        >
                            Reintentar
                        </button>
                    </div>
                </Card>
            </div>
        );
    }

    const isFulfilled = order.fulfillmentStatus === 'fulfilled';

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <button
                onClick={() => navigate('/pedidos')}
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
                <ArrowLeft size={20} />
                Volver a Pedidos
            </button>

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Pedido {order.name}</h2>
                    <p className="text-gray-500 mt-1 flex items-center gap-2">
                        <Calendar size={16} />
                        {formatDateTime(order.createdAt)}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant={getFinancialStatusVariant(order.financialStatus)} size="md">
                        {translateFinancialStatus(order.financialStatus)}
                    </Badge>
                    <Badge variant={getFulfillmentStatusVariant(order.fulfillmentStatus)} size="md">
                        {translateFulfillmentStatus(order.fulfillmentStatus)}
                    </Badge>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Products Section */}
                    <Card
                        header={
                            <CardHeader
                                title="Productos"
                                subtitle={`${order.lineItems.length} producto${order.lineItems.length !== 1 ? 's' : ''}`}
                            />
                        }
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                            Producto
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                                            Cantidad
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                                            Precio
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {order.lineItems.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-gray-900">{item.title}</p>
                                                    {item.variantTitle && (
                                                        <p className="text-sm text-gray-500">{item.variantTitle}</p>
                                                    )}
                                                    {item.sku && (
                                                        <p className="text-xs text-gray-400">SKU: {item.sku}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center text-gray-600">
                                                {item.quantity}
                                            </td>
                                            <td className="px-6 py-4 text-right text-gray-600">
                                                {formatCurrency(item.price)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-gray-900">
                                                {formatCurrency((parseFloat(item.price) * item.quantity).toString())}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div className="border-t border-gray-100 px-6 py-4 space-y-2">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>{formatCurrency(order.subtotalPrice)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Envío</span>
                                <span>{formatCurrency(order.totalShippingPrice)}</span>
                            </div>
                            {parseFloat(order.totalDiscounts) > 0 && (
                                <div className="flex justify-between text-emerald-600">
                                    <span>Descuentos</span>
                                    <span>-{formatCurrency(order.totalDiscounts)}</span>
                                </div>
                            )}
                            {parseFloat(order.totalTax) > 0 && (
                                <div className="flex justify-between text-gray-600">
                                    <span>Impuestos</span>
                                    <span>{formatCurrency(order.totalTax)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-100">
                                <span>Total</span>
                                <span>{formatCurrency(order.totalPrice)}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Fulfillment Section */}
                    <Card
                        header={
                            <CardHeader
                                title="Envío"
                                subtitle={isFulfilled ? 'Pedido enviado' : 'Pendiente de envío'}
                            />
                        }
                        padding="md"
                    >
                        {isFulfilled ? (
                            // Already fulfilled - show tracking info
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                                    <Truck size={24} className="text-blue-600" />
                                    <div>
                                        <p className="font-medium text-blue-800">Pedido enviado</p>
                                        <p className="text-sm text-blue-600">
                                            El cliente ha sido notificado del envío
                                        </p>
                                    </div>
                                </div>

                                {order.fulfillments && order.fulfillments.length > 0 && (
                                    <div className="space-y-3">
                                        {order.fulfillments.map((fulfillment) => (
                                            <div key={fulfillment.id} className="p-4 bg-gray-50 rounded-lg">
                                                {fulfillment.trackingNumber && (
                                                    <p className="text-sm">
                                                        <span className="text-gray-500">Número de seguimiento:</span>{' '}
                                                        <span className="font-medium">{fulfillment.trackingNumber}</span>
                                                    </p>
                                                )}
                                                {fulfillment.trackingCompany && (
                                                    <p className="text-sm">
                                                        <span className="text-gray-500">Empresa:</span>{' '}
                                                        <span className="font-medium">{fulfillment.trackingCompany}</span>
                                                    </p>
                                                )}
                                                {fulfillment.trackingUrl && (
                                                    <a
                                                        href={fulfillment.trackingUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-sm text-rose-600 hover:text-rose-700 mt-2"
                                                    >
                                                        Ver seguimiento
                                                        <ExternalLink size={14} />
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Not fulfilled - show form
                            <FulfillmentForm
                                orderId={orderId!}
                                onSuccess={handleFulfillmentSuccess}
                            />
                        )}
                    </Card>
                </div>

                {/* Right Column - Customer & Address */}
                <div className="space-y-6">
                    {/* Customer Info */}
                    <Card
                        header={
                            <CardHeader title="Cliente" />
                        }
                        padding="md"
                    >
                        {order.customer ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-purple-500 rounded-full flex items-center justify-center">
                                        <User size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {order.customer.firstName} {order.customer.lastName}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {order.customer.ordersCount} pedido{order.customer.ordersCount !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-gray-100 space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Mail size={16} className="text-gray-400" />
                                        <a
                                            href={`mailto:${order.customer.email}`}
                                            className="text-gray-600 hover:text-rose-600 transition-colors"
                                        >
                                            {order.customer.email}
                                        </a>
                                    </div>
                                    {order.customer.phone && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Phone size={16} className="text-gray-400" />
                                            <a
                                                href={`tel:${order.customer.phone}`}
                                                className="text-gray-600 hover:text-rose-600 transition-colors"
                                            >
                                                {order.customer.phone}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-400 text-center py-4">Sin información de cliente</p>
                        )}
                    </Card>

                    {/* Shipping Address */}
                    <Card
                        header={
                            <CardHeader title="Dirección de envío" />
                        }
                        padding="md"
                    >
                        {order.shippingAddress ? (
                            <div className="flex items-start gap-3">
                                <MapPin size={20} className="text-gray-400 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-gray-600 space-y-1">
                                    <p className="font-medium text-gray-900">
                                        {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                                    </p>
                                    <p>{order.shippingAddress.address1}</p>
                                    {order.shippingAddress.address2 && (
                                        <p>{order.shippingAddress.address2}</p>
                                    )}
                                    <p>
                                        {order.shippingAddress.city}, {order.shippingAddress.province}
                                    </p>
                                    <p>{order.shippingAddress.zip}</p>
                                    <p>{order.shippingAddress.country}</p>
                                    {order.shippingAddress.phone && (
                                        <p className="pt-2 flex items-center gap-1">
                                            <Phone size={14} />
                                            {order.shippingAddress.phone}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-400 text-center py-4">Sin dirección de envío</p>
                        )}
                    </Card>

                    {/* Order Notes */}
                    {order.note && (
                        <Card
                            header={
                                <CardHeader title="Notas del pedido" />
                            }
                            padding="md"
                        >
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{order.note}</p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
