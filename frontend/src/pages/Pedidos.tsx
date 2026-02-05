import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, RefreshCw, Package, AlertCircle, Search, Filter, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import { getOrders } from '../services/api';
import type { Order } from '../types/shopify';
import { calculateShippingDate, formatDisplayDate } from '../utils/shippingUtils';
import Card from '../components/Card';
import Badge, {
    getFinancialStatusVariant,
    getFulfillmentStatusVariant,
    translateFinancialStatus,
    translateFulfillmentStatus,
} from '../components/Badge';

// Format date to DD/MM/YYYY

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

// Loading skeleton row
function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
            <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
            <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
            <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
            <td className="px-5 py-4"><div className="h-6 bg-gray-200 rounded w-16"></div></td>
            <td className="px-5 py-4"><div className="h-6 bg-gray-200 rounded w-16"></div></td>
            <td className="px-5 py-4"><div className="h-8 bg-gray-200 rounded w-20"></div></td>
        </tr>
    );
}

// Filter options
type FulfillmentFilter = 'all' | 'pending' | 'fulfilled';
type SortOrder = 'desc' | 'asc';

export default function Pedidos() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const navigate = useNavigate();

    // Filter and search state
    const [searchQuery, setSearchQuery] = useState('');
    const [fulfillmentFilter, setFulfillmentFilter] = useState<FulfillmentFilter>('all');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [sortBy, setSortBy] = useState<'purchase' | 'dispatch'>('purchase');
    const [showFilters, setShowFilters] = useState(false);

    // Fetch orders
    const fetchOrders = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            const response = await getOrders();
            setOrders(response.data || []);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error al cargar pedidos';
            setError(message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Filtered and sorted orders
    const filteredOrders = useMemo(() => {
        let result = [...orders];

        // Filter by fulfillment status
        if (fulfillmentFilter === 'pending') {
            result = result.filter(o => !o.fulfillmentStatus || o.fulfillmentStatus === 'unfulfilled');
        } else if (fulfillmentFilter === 'fulfilled') {
            result = result.filter(o => o.fulfillmentStatus === 'fulfilled');
        }

        // Search by order number or customer
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(o =>
                o.name?.toLowerCase().includes(query) ||
                o.orderNumber?.toString().includes(query) ||
                o.customer?.firstName?.toLowerCase().includes(query) ||
                o.customer?.lastName?.toLowerCase().includes(query) ||
                o.customer?.email?.toLowerCase().includes(query)
            );
        }

        // Sort logic
        result.sort((a, b) => {
            let valA, valB;

            if (sortBy === 'dispatch') {
                valA = calculateShippingDate(a.createdAt, a.lineItems).getTime();
                valB = calculateShippingDate(b.createdAt, b.lineItems).getTime();
            } else {
                valA = new Date(a.createdAt).getTime();
                valB = new Date(b.createdAt).getTime();
            }

            return sortOrder === 'desc' ? valB - valA : valA - valB;
        });
        return result;
    }, [orders, fulfillmentFilter, searchQuery, sortOrder, sortBy]);

    // Stats
    const stats = useMemo(() => ({
        total: orders.length,
        pending: orders.filter(o => !o.fulfillmentStatus || o.fulfillmentStatus === 'unfulfilled').length,
        fulfilled: orders.filter(o => o.fulfillmentStatus === 'fulfilled').length,
    }), [orders]);

    // Empty state component
    const EmptyState = () => (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Package size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">
                {searchQuery || fulfillmentFilter !== 'all' ? 'Sin resultados' : 'No hay pedidos'}
            </h3>
            <p className="text-gray-500 max-w-sm">
                {searchQuery || fulfillmentFilter !== 'all'
                    ? 'No se encontraron pedidos con los filtros aplicados'
                    : 'Cuando recibas pedidos en tu tienda Shopify, aparecerán aquí.'
                }
            </p>
            {(searchQuery || fulfillmentFilter !== 'all') && (
                <button
                    onClick={() => { setSearchQuery(''); setFulfillmentFilter('all'); }}
                    className="mt-4 px-4 py-2 text-sm font-medium text-rose-600 hover:text-rose-700"
                >
                    Limpiar filtros
                </button>
            )}
        </div>
    );

    // Error state component
    const ErrorState = () => (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <AlertCircle size={32} className="text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Error al cargar</h3>
            <p className="text-gray-500 max-w-sm mb-4">{error}</p>
            <button
                onClick={() => fetchOrders()}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
                Reintentar
            </button>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Pedidos</h2>
                    <p className="text-gray-500 mt-1">
                        {!loading && !error && (
                            <>
                                {filteredOrders.length} de {orders.length} pedido{orders.length !== 1 ? 's' : ''}
                                {(searchQuery || fulfillmentFilter !== 'all') && ' (filtrado)'}
                            </>
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${showFilters || fulfillmentFilter !== 'all'
                            ? 'bg-rose-50 border-rose-200 text-rose-700'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <Filter size={18} />
                        <span className="text-sm font-medium hidden sm:inline">Filtros</span>
                        {fulfillmentFilter !== 'all' && (
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        )}
                    </button>

                    {/* Sync Button */}
                    <button
                        onClick={() => fetchOrders(true)}
                        disabled={refreshing || loading}
                        className="inline-flex items-center gap-2 px-4 py-2 
                         bg-gradient-to-r from-rose-500 to-purple-500 
                         text-white rounded-lg font-medium shadow-md 
                         hover:shadow-lg transition-all duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                        {refreshing ? 'Actualizando...' : 'Sincronizar'}
                    </button>
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por # orden o cliente..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg
                                         focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500
                                         transition-colors outline-none"
                            />
                        </div>

                        {/* Fulfillment Filter */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Estado Envío:</span>
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                {[
                                    { value: 'all', label: 'Todos', count: stats.total },
                                    { value: 'pending', label: 'Pendientes', count: stats.pending },
                                    { value: 'fulfilled', label: 'Enviados', count: stats.fulfilled },
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setFulfillmentFilter(option.value as FulfillmentFilter)}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${fulfillmentFilter === option.value
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        {option.label} ({option.count})
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sort Order */}
                        <button
                            onClick={() => setSortOrder(s => s === 'desc' ? 'asc' : 'desc')}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            <ArrowUpDown size={16} />
                            <span className="text-sm font-medium">
                                {sortOrder === 'desc' ? 'Más recientes' : 'Más antiguos'}
                            </span>
                        </button>
                    </div>
                </div>
            )}

            {/* Orders Table Card */}
            <Card padding="none">
                {/* Error State */}
                {error && !loading && <ErrorState />}

                {/* Loading State */}
                {loading && (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Orden</th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cliente</th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Pago</th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado Envío</th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {[...Array(5)].map((_, i) => (
                                    <SkeletonRow key={i} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && filteredOrders.length === 0 && <EmptyState />}

                {/* Orders Table */}
                {!loading && !error && filteredOrders.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Orden
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Cliente
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Producto
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Dirección
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        <button
                                            onClick={() => {
                                                if (sortBy === 'purchase') {
                                                    setSortOrder(s => s === 'desc' ? 'asc' : 'desc');
                                                } else {
                                                    setSortBy('purchase');
                                                    setSortOrder('desc');
                                                }
                                            }}
                                            className={`flex items-center gap-1 hover:text-gray-900 ${sortBy === 'purchase' ? 'text-gray-900 border-b border-gray-400' : ''}`}
                                        >
                                            Compra
                                            {sortBy === 'purchase' && (sortOrder === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />)}
                                        </button>
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        <button
                                            onClick={() => {
                                                if (sortBy === 'dispatch') {
                                                    setSortOrder(s => s === 'desc' ? 'asc' : 'desc');
                                                } else {
                                                    setSortBy('dispatch');
                                                    setSortOrder('desc');
                                                }
                                            }}
                                            className={`flex items-center gap-1 hover:text-rose-700 font-bold ${sortBy === 'dispatch' ? 'text-rose-600 border-b border-rose-400' : 'text-rose-500'}`}
                                        >
                                            Despacho
                                            {sortBy === 'dispatch' && (sortOrder === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />)}
                                        </button>
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50 border-l border-gray-100">
                                        Info / Pago
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Acción
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredOrders.map((order) => {
                                    const shippingDate = calculateShippingDate(order.createdAt, order.lineItems);
                                    const primaryItem = order.lineItems[0];
                                    const address = order.shippingAddress;

                                    return (
                                        <tr
                                            key={order.id}
                                            className="hover:bg-gray-50 transition-colors duration-150"
                                        >
                                            {/* Order Number */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className="font-semibold text-gray-900">{order.name}</span>
                                            </td>

                                            {/* Customer */}
                                            <td className="px-5 py-4 whitespace-nowrap text-sm">
                                                {order.customer ? (
                                                    <div>
                                                        <p className="text-gray-900 font-medium">
                                                            {order.customer.firstName} {order.customer.lastName}
                                                        </p>
                                                        <p className="text-[11px] text-gray-400">{order.customer.email}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">Invitado</span>
                                                )}
                                            </td>

                                            {/* Product Name + Model */}
                                            <td className="px-5 py-4 min-w-[180px]">
                                                {primaryItem ? (
                                                    <div>
                                                        <p className="text-gray-900 text-[13px] font-medium leading-tight">
                                                            {primaryItem.title}
                                                        </p>
                                                        <p className="text-[11px] text-gray-500 italic mt-0.5">
                                                            {primaryItem.variantTitle || 'Sin modelo'}
                                                            {order.lineItems.length > 1 && (
                                                                <span className="ml-1 text-rose-500 font-semibold not-italic">
                                                                    (+{order.lineItems.length - 1} otro)
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>

                                            {/* Address */}
                                            <td className="px-5 py-4 text-xs text-gray-600 min-w-[160px]">
                                                {address ? (
                                                    <div className="line-clamp-2">
                                                        <p className="font-medium text-gray-700">{address.address1}</p>
                                                        <p className="text-gray-400">{address.city}, {address.province}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>

                                            {/* Date Buy */}
                                            <td className="px-5 py-4 whitespace-nowrap text-gray-600 text-sm">
                                                {formatDisplayDate(new Date(order.createdAt))}
                                            </td>

                                            {/* Shipping Date */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-rose-600 font-bold text-sm">
                                                        {formatDisplayDate(shippingDate)}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 uppercase tracking-tighter">
                                                        Fecha Despacho
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Grouped Status/Resumen */}
                                            <td className="px-5 py-4 whitespace-nowrap bg-gray-50/30 border-l border-gray-100">
                                                <div className="flex flex-col gap-1.5 min-w-[120px]">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] text-gray-400 uppercase font-medium">Monto:</span>
                                                        <span className="text-xs font-bold text-gray-900">{formatCurrency(order.totalPrice)}</span>
                                                    </div>
                                                    <div className="flex gap-1 flex-wrap">
                                                        <Badge
                                                            variant={getFinancialStatusVariant(order.financialStatus)}
                                                            size="sm"
                                                        >
                                                            {translateFinancialStatus(order.financialStatus)}
                                                        </Badge>
                                                        <Badge
                                                            variant={getFulfillmentStatusVariant(order.fulfillmentStatus)}
                                                            size="sm"
                                                        >
                                                            {translateFulfillmentStatus(order.fulfillmentStatus)}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => navigate(`/pedidos/${order.id}`)}
                                                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-full transition-colors flex items-center justify-center"
                                                    title="Ver detalles"
                                                >
                                                    <Eye size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
