import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, RefreshCw, Package, AlertCircle, Search, ArrowUpDown, ChevronDown, ChevronUp, Calendar, CheckSquare, Square } from 'lucide-react';
import { getOrders, ordersApi } from '../services/api';
import type { Order } from '../types/shopify';
import { calculateShippingDate } from '../utils/shippingUtils';
import { useResizable } from '../hooks/useResizable';
import Card from '../components/Card';
import Badge, {
    getFinancialStatusVariant,
    getFulfillmentStatusVariant,
    translateFinancialStatus,
    translateFulfillmentStatus,
} from '../components/Badge';
import BulkFulfillModal from '../components/BulkFulfillModal';

// Format date to DD/MM/YYYY
function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Format dispatch date with day of week
function formatDispatchDate(date: Date): { date: string, day: string } {
    const dateStr = date.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    const dayStr = date.toLocaleDateString('es-CL', { weekday: 'long' });
    return { date: dateStr, day: dayStr.charAt(0).toUpperCase() + dayStr.slice(1) };
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

// Resize Handle Component
const ResizeHandle = ({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) => (
    <div
        onMouseDown={onMouseDown}
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-rose-400 active:bg-rose-600 transition-colors z-10"
        title="Ajustar ancho"
    />
);

// Filter options
type FulfillmentFilter = 'all' | 'pending' | 'fulfilled';
type DateFilter = 'all' | '7days' | '15days' | '30days' | '60days' | '90days';
type SortOrder = 'desc' | 'asc';

export default function Pedidos() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const navigate = useNavigate();

    // Resizable Columns
    const { columnWidths, onMouseDown } = useResizable({
        order: 100,
        customer: 180,
        product: 250,
        address: 200,
        type: 100,
        date: 100,
        dispatch: 120,
        status: 140,
        actions: 80
    });

    // Filter and search state
    const [searchQuery, setSearchQuery] = useState('');
    const [fulfillmentFilter, setFulfillmentFilter] = useState<FulfillmentFilter>('all');
    const [dateFilter, setDateFilter] = useState<DateFilter>('all');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [sortBy, setSortBy] = useState<'purchase' | 'dispatch'>('purchase');

    // Bulk Actions State
    const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [isBulkFulfilling, setIsBulkFulfilling] = useState(false);

    // Toggle single order selection
    const toggleOrder = (id: number) => {
        const newSelected = new Set(selectedOrders);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedOrders(newSelected);
    };

    // Toggle all visible orders
    const toggleAll = () => {
        if (selectedOrders.size === filteredOrders.length && filteredOrders.length > 0) {
            setSelectedOrders(new Set());
        } else {
            setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
        }
    };

    // Bulk Fulfill Handler - Now accepts payload per order
    const handleBulkFulfill = async (payload: Record<number, { trackingNumber?: string, trackingCompany?: string, trackingUrl?: string }>) => {
        setIsBulkFulfilling(true);
        try {
            const promises = Object.entries(payload).map(([orderId, data]) =>
                ordersApi.fulfill(orderId, {
                    trackingNumber: data.trackingNumber || undefined,
                    trackingCompany: data.trackingCompany || undefined,
                    trackingUrl: data.trackingUrl || undefined
                })
            );

            await Promise.all(promises);

            // Success
            setIsBulkModalOpen(false);
            setSelectedOrders(new Set());
            fetchOrders(true); // Refresh data
        } catch (err) {
            console.error('Error fulfilling orders:', err);
            alert('Error al procesar algunos pedidos. Por favor revisa la consola.');
        } finally {
            setIsBulkFulfilling(false);
        }
    };


    // Fetch orders
    const fetchOrders = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            const response = await getOrders(); // Now defaults to 250 from server
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

        // 1. Filter by fulfillment status
        if (fulfillmentFilter === 'pending') {
            result = result.filter(o => !o.fulfillmentStatus || o.fulfillmentStatus === 'unfulfilled');
        } else if (fulfillmentFilter === 'fulfilled') {
            result = result.filter(o => o.fulfillmentStatus === 'fulfilled');
        }

        // 2. Filter by Date Range
        if (dateFilter !== 'all') {
            const now = new Date();
            const daysMap = {
                '7days': 7,
                '15days': 15,
                '30days': 30,
                '60days': 60,
                '90days': 90
            };
            const days = daysMap[dateFilter];
            const cutoffDate = new Date(now.setDate(now.getDate() - days));

            result = result.filter(o => new Date(o.createdAt) >= cutoffDate);
        }

        // 3. Search by order number or customer
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

        // 4. Sort logic
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
    }, [orders, fulfillmentFilter, dateFilter, searchQuery, sortOrder, sortBy]);
    // Memoized selected orders list
    const selectedOrdersList = useMemo(() => {
        return filteredOrders.filter(o => selectedOrders.has(o.id));
    }, [filteredOrders, selectedOrders]);

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
                {searchQuery || fulfillmentFilter !== 'all' || dateFilter !== 'all' ? 'Sin resultados' : 'No hay pedidos'}
            </h3>
            <p className="text-gray-500 max-w-sm">
                {searchQuery || fulfillmentFilter !== 'all' || dateFilter !== 'all'
                    ? 'No se encontraron pedidos con los filtros aplicados'
                    : 'Cuando recibas pedidos en tu tienda Shopify, aparecerán aquí.'
                }
            </p>
            <button
                onClick={() => { setSearchQuery(''); setFulfillmentFilter('all'); setDateFilter('all'); }}
                className="mt-4 px-4 py-2 text-sm font-medium text-rose-600 hover:text-rose-700"
            >
                Limpiar filtros
            </button>
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
                    <h2 className="text-2xl font-bold text-gray-800">PEDIDOS</h2>
                    <p className="text-gray-500 mt-1">
                        {!loading && !error && (
                            <>
                                {filteredOrders.length} de {orders.length} pedido{orders.length !== 1 ? 's' : ''} cargados
                                {(searchQuery || fulfillmentFilter !== 'all' || dateFilter !== 'all') && ' (filtrado)'}
                            </>
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-3">
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
            <div className={`bg-white rounded-xl border ${selectedOrders.size > 0 ? 'border-rose-200 ring-1 ring-rose-100' : 'border-gray-200'} p-4 space-y-4 shadow-sm transition-all duration-300`}>

                {/* Bulk Action Bar (Overlays filters when active) */}
                {selectedOrders.size > 0 ? (
                    <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center gap-3">
                            <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-sm font-medium">
                                {selectedOrders.size} seleccionado{selectedOrders.size !== 1 ? 's' : ''}
                            </span>
                            <button
                                onClick={() => setSelectedOrders(new Set())}
                                className="text-gray-500 hover:text-gray-700 text-sm underline"
                            >
                                Deseleccionar todo
                            </button>
                        </div>
                        <button
                            onClick={() => setIsBulkModalOpen(true)}
                            className="bg-rose-600 text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-rose-700 transition-colors flex items-center gap-2"
                        >
                            <Package size={18} />
                            Marcar como Enviados
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col xl:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[250px]">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por # orden o cliente..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg
                                             focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500
                                             transition-colors outline-none h-10"
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
                            {/* Fulfillment Filter */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500 whitespace-nowrap">Estado Envío:</span>
                                <div className="flex bg-gray-100 rounded-lg p-1 h-10">
                                    {[
                                        { value: 'all', label: 'Todos', count: stats.total },
                                        { value: 'pending', label: 'Pendientes', count: stats.pending },
                                        { value: 'fulfilled', label: 'Enviados', count: stats.fulfilled },
                                    ].map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => setFulfillmentFilter(option.value as FulfillmentFilter)}
                                            className={`px-3 py-1 text-xs sm:text-sm font-medium rounded-md transition-colors ${fulfillmentFilter === option.value
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Date Filter */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500 whitespace-nowrap"><Calendar size={16} className="inline mr-1" />Fecha:</span>
                                <div className="relative">
                                    <select
                                        value={dateFilter}
                                        onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                                        className="appearance-none h-10 pl-3 pr-8 border border-gray-200 rounded-lg bg-gray-50 hover:bg-white text-sm focus:ring-2 focus:ring-rose-500/20 outline-none cursor-pointer"
                                        style={{ minWidth: '160px' }}
                                    >
                                        <option value="all">Histórico (250)</option>
                                        <option value="7days">Última semana</option>
                                        <option value="15days">Últimos 15 días</option>
                                        <option value="30days">Último mes</option>
                                        <option value="60days">Últimos 2 meses</option>
                                        <option value="90days">Últimos 3 meses</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Sort Order */}
                            <button
                                onClick={() => setSortOrder(s => s === 'desc' ? 'asc' : 'desc')}
                                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors h-10"
                            >
                                <ArrowUpDown size={16} />
                                <span className="text-sm font-medium">
                                    {sortOrder === 'desc' ? 'Más recientes' : 'Más antiguos'}
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Orders Table Card - Overflow hidden to contain sticky headers logic if needed */}
            <Card padding="none">
                {/* Error State */}
                {error && !loading && <ErrorState />}

                {/* Loading State */}
                {loading && (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    {/* Mock headers during loading */}
                                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Orden</th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Cliente</th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Producto</th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Dirección</th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Tipo</th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Despacho</th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Estado Envío</th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
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
                        <table className="w-full relative" style={{ tableLayout: 'fixed' }}>
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-5 py-4 w-[50px]">
                                        <button
                                            onClick={toggleAll}
                                            className="text-gray-400 hover:text-rose-600 transition-colors"
                                        >
                                            {selectedOrders.size > 0 && selectedOrders.size === filteredOrders.length ? (
                                                <CheckSquare size={20} className="text-rose-600" />
                                            ) : (
                                                <Square size={20} />
                                            )}
                                        </button>
                                    </th>
                                    <th className="relative px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider overflow-hidden text-ellipsis"
                                        style={{ width: columnWidths.order }}>
                                        ORDEN
                                        <ResizeHandle onMouseDown={(e) => onMouseDown(e, 'order')} />
                                    </th>
                                    <th className="relative px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider overflow-hidden text-ellipsis"
                                        style={{ width: columnWidths.customer }}>
                                        CLIENTE
                                        <ResizeHandle onMouseDown={(e) => onMouseDown(e, 'customer')} />
                                    </th>
                                    <th className="relative px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider overflow-hidden text-ellipsis"
                                        style={{ width: columnWidths.product }}>
                                        PRODUCTO
                                        <ResizeHandle onMouseDown={(e) => onMouseDown(e, 'product')} />
                                    </th>
                                    <th className="relative px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider overflow-hidden text-ellipsis"
                                        style={{ width: columnWidths.address }}>
                                        DIRECCIÓN
                                        <ResizeHandle onMouseDown={(e) => onMouseDown(e, 'address')} />
                                    </th>
                                    <th className="relative px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider overflow-hidden text-ellipsis"
                                        style={{ width: columnWidths.type }}>
                                        TIPO
                                        <ResizeHandle onMouseDown={(e) => onMouseDown(e, 'type')} />
                                    </th>
                                    <th className="relative px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider overflow-hidden"
                                        style={{ width: columnWidths.date }}>
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
                                            FECHA
                                            {sortBy === 'purchase' && (sortOrder === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />)}
                                        </button>
                                        <ResizeHandle onMouseDown={(e) => onMouseDown(e, 'date')} />
                                    </th>
                                    <th className="relative px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider overflow-hidden"
                                        style={{ width: columnWidths.dispatch }}>
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
                                            DESPACHO
                                            {sortBy === 'dispatch' && (sortOrder === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />)}
                                        </button>
                                        <ResizeHandle onMouseDown={(e) => onMouseDown(e, 'dispatch')} />
                                    </th>
                                    <th className="relative px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50 border-l border-gray-100 overflow-hidden text-ellipsis"
                                        style={{ width: columnWidths.status }}>
                                        INFO / PAGO
                                        <ResizeHandle onMouseDown={(e) => onMouseDown(e, 'status')} />
                                    </th>
                                    <th className="relative px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider overflow-hidden"
                                        style={{ width: columnWidths.actions }}>
                                        ACCIÓN
                                        <ResizeHandle onMouseDown={(e) => onMouseDown(e, 'actions')} />
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredOrders.map((order) => {
                                    const shippingDate = calculateShippingDate(order.createdAt, order.lineItems);
                                    const primaryItem = order.lineItems[0];
                                    const address = order.shippingAddress;
                                    const isAPedido = order.lineItems.some(item => (item.title || '').toUpperCase().includes('PEDIDO'));

                                    return (
                                        <tr
                                            key={order.id}
                                            className={`hover:bg-gray-50 transition-colors duration-150 ${selectedOrders.has(order.id) ? 'bg-rose-50/40 hover:bg-rose-50/60' : ''}`}
                                        >
                                            <td className="px-5 py-4 relative">
                                                <button
                                                    onClick={() => toggleOrder(order.id)}
                                                    className="text-gray-400 hover:text-rose-600 transition-colors"
                                                >
                                                    {selectedOrders.has(order.id) ? (
                                                        <CheckSquare size={20} className="text-rose-600" />
                                                    ) : (
                                                        <Square size={20} />
                                                    )}
                                                </button>
                                            </td>
                                            {/* Order Number */}
                                            <td className="px-5 py-4 whitespace-nowrap overflow-hidden text-ellipsis">
                                                <span className="font-semibold text-gray-900">{order.name}</span>
                                            </td>

                                            {/* Customer */}
                                            <td className="px-5 py-4 whitespace-nowrap text-sm overflow-hidden text-ellipsis">
                                                {order.customer ? (
                                                    <div>
                                                        <p className="text-gray-900 font-medium truncate" title={`${order.customer.firstName} ${order.customer.lastName}`}>
                                                            {order.customer.firstName} {order.customer.lastName}
                                                        </p>
                                                        <p className="text-[11px] text-gray-400 truncate" title={order.customer.email}>{order.customer.email}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">Invitado</span>
                                                )}
                                            </td>

                                            {/* Product Name + Model */}
                                            <td className="px-5 py-4 overflow-hidden">
                                                {primaryItem ? (
                                                    <div className="max-w-full">
                                                        <p className="text-gray-900 text-[13px] font-medium leading-tight truncate" title={primaryItem.title}>
                                                            {primaryItem.title}
                                                        </p>
                                                        <p className="text-[11px] text-gray-500 italic mt-0.5 truncate" title={primaryItem.variantTitle}>
                                                            {primaryItem.variantTitle || 'Sin modelo'}
                                                            {order.lineItems.length > 1 && (
                                                                <span className="ml-1 text-rose-500 font-semibold not-italic">
                                                                    (+{order.lineItems.length - 1})
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>

                                            {/* Address */}
                                            <td className="px-5 py-4 text-xs text-gray-600 overflow-hidden">
                                                {address ? (
                                                    <div className="truncate">
                                                        <p className="font-medium text-gray-700 truncate" title={address.address1}>{address.address1}</p>
                                                        <p className="text-gray-400 truncate" title={`${address.city}, ${address.province}`}>{address.city}, ${address.province}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>

                                            {/* TIPO */}
                                            <td className="px-5 py-4 whitespace-nowrap overflow-hidden">
                                                {isAPedido ? (
                                                    <Badge variant="warning" size="sm">A PEDIDO</Badge>
                                                ) : (
                                                    <Badge variant="success" size="sm">EN STOCK</Badge>
                                                )}
                                            </td>

                                            {/* Date Buy */}
                                            <td className="px-5 py-4 whitespace-nowrap text-gray-600 text-sm overflow-hidden">
                                                {formatDate(order.createdAt)}
                                            </td>

                                            {/* Shipping Date */}
                                            <td className="px-5 py-4 whitespace-nowrap overflow-hidden">
                                                <div className="flex flex-col">
                                                    <span className="text-rose-600 font-bold text-sm">
                                                        {formatDispatchDate(shippingDate).date}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 uppercase tracking-tighter font-semibold">
                                                        {formatDispatchDate(shippingDate).day}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Grouped Status/Resumen */}
                                            <td className="px-5 py-4 whitespace-nowrap bg-gray-50/30 border-l border-gray-100 overflow-hidden">
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
                                            <td className="px-5 py-4 whitespace-nowrap overflow-hidden">
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

            <BulkFulfillModal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                onConfirm={handleBulkFulfill}
                orders={selectedOrdersList}
                loading={isBulkFulfilling}
            />
        </div>
    );
}
