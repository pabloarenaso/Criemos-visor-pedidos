import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    Search,
    Users,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Star,
    Mail,
} from 'lucide-react';
import { getOrders, getCustomers } from '../services/api';
import type { Order, Customer } from '../types/shopify';
import Card, { CardHeader } from '../components/Card';
import Badge from '../components/Badge';

// Format currency
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
    }).format(amount);
}

// Format date
function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-CL', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

// Customer data with calculated stats
interface CustomerWithStats {
    customer: Customer;
    orderCount: number;
    totalSpent: number;
    lastOrderDate: string | null;
    orders: Order[];
}

// Skeleton row
function CustomerRowSkeleton() {
    return (
        <div className="flex items-center gap-4 py-4 px-4 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
        </div>
    );
}

// Customer Row Component
interface CustomerRowProps {
    data: CustomerWithStats;
    isExpanded: boolean;
    onToggle: () => void;
}

function CustomerRow({ data, isExpanded, onToggle }: CustomerRowProps) {
    const { customer, orderCount, totalSpent, lastOrderDate, orders } = data;
    const isRecurring = orderCount >= 2;

    const initials = `${customer.firstName?.[0] || ''}${customer.lastName?.[0] || ''}`.toUpperCase() || '?';

    return (
        <div className={`border-b border-gray-100 last:border-0 ${isExpanded ? 'bg-gray-50/50' : ''}`}>
            {/* Main Row */}
            <div
                className="flex items-center gap-4 py-4 px-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={onToggle}
            >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-medium text-sm ${isRecurring
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                    }`}>
                    {initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">
                            {customer.firstName} {customer.lastName}
                        </p>
                        {isRecurring && (
                            <Star size={14} className="text-amber-500 fill-amber-500 flex-shrink-0" />
                        )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                        {customer.email && (
                            <span className="flex items-center gap-1 truncate">
                                <Mail size={12} />
                                {customer.email}
                            </span>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="hidden sm:flex items-center gap-6 flex-shrink-0">
                    <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{orderCount}</p>
                        <p className="text-xs text-gray-500">pedidos</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(totalSpent)}</p>
                        <p className="text-xs text-gray-500">total</p>
                    </div>
                    {lastOrderDate && (
                        <div className="text-right hidden lg:block">
                            <p className="text-sm text-gray-700">{formatDate(lastOrderDate)}</p>
                            <p className="text-xs text-gray-500">último pedido</p>
                        </div>
                    )}
                </div>

                {/* Expand Icon */}
                <div className="text-gray-400">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && orders.length > 0 && (
                <div className="px-4 pb-4">
                    <div className="ml-14 bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                            <p className="text-xs font-semibold text-gray-500 uppercase">Historial de Pedidos</p>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {orders.slice(0, 5).map(order => (
                                <Link
                                    key={order.id}
                                    to={`/pedidos/${order.id}`}
                                    className="flex items-center justify-between px-4 py-3 hover:bg-blue-50/50 transition-colors"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900">{order.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {formatDate(order.createdAt)} • {order.lineItems?.length || 0} productos
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-semibold text-gray-900">
                                            {formatCurrency(parseFloat(order.totalPrice))}
                                        </span>
                                        <Badge
                                            variant={order.fulfillmentStatus ? 'success' : 'warning'}
                                            size="sm"
                                        >
                                            {order.fulfillmentStatus ? 'Enviado' : 'Pendiente'}
                                        </Badge>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        {orders.length > 5 && (
                            <div className="px-4 py-2 bg-gray-50 text-center">
                                <span className="text-xs text-gray-500">
                                    +{orders.length - 5} pedidos más
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Clientes() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showOnlyRecurring, setShowOnlyRecurring] = useState(false);
    const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [customersRes, ordersRes] = await Promise.all([
                getCustomers(),
                getOrders(),
            ]);

            setCustomers(customersRes.data || []);
            setOrders(ordersRes.data || []);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error al cargar clientes';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Build customer stats from orders
    const customersWithStats = useMemo((): CustomerWithStats[] => {
        const statsMap = new Map<string, CustomerWithStats>();

        // Initialize from customers list
        customers.forEach(customer => {
            if (customer.email) {
                statsMap.set(customer.email, {
                    customer,
                    orderCount: 0,
                    totalSpent: 0,
                    lastOrderDate: null,
                    orders: [],
                });
            }
        });

        // Aggregate order data
        orders.forEach(order => {
            if (order.customer?.email) {
                const email = order.customer.email;

                // Ensure entry exists
                if (!statsMap.has(email)) {
                    // Customer from order but not in customers list
                    const newEntry: CustomerWithStats = {
                        customer: {
                            id: order.customer.id || 0,
                            firstName: order.customer.firstName || '',
                            lastName: order.customer.lastName || '',
                            email: order.customer.email,
                            phone: order.customer.phone || undefined,
                            ordersCount: 0,
                            totalSpent: '0',
                            createdAt: order.createdAt,
                            updatedAt: order.createdAt,
                        },
                        orderCount: 0,
                        totalSpent: 0,
                        lastOrderDate: null,
                        orders: [],
                    };
                    statsMap.set(email, newEntry);
                }

                // Get the entry (now guaranteed to exist)
                const customerData = statsMap.get(email)!;
                customerData.orderCount++;
                customerData.totalSpent += parseFloat(order.totalPrice || '0');
                customerData.orders.push(order);

                if (!customerData.lastOrderDate || new Date(order.createdAt) > new Date(customerData.lastOrderDate)) {
                    customerData.lastOrderDate = order.createdAt;
                }
            }
        });

        // Sort orders within each customer by date descending
        statsMap.forEach(data => {
            data.orders.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        });

        return Array.from(statsMap.values());
    }, [customers, orders]);

    // Filter and sort customers
    const filteredCustomers = useMemo(() => {
        let result = customersWithStats;

        // Filter by search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(data =>
                data.customer.firstName?.toLowerCase().includes(query) ||
                data.customer.lastName?.toLowerCase().includes(query) ||
                data.customer.email?.toLowerCase().includes(query) ||
                data.customer.phone?.includes(query)
            );
        }

        // Filter recurring only
        if (showOnlyRecurring) {
            result = result.filter(data => data.orderCount >= 2);
        }

        // Sort by order count descending
        return result.sort((a, b) => b.orderCount - a.orderCount);
    }, [customersWithStats, searchQuery, showOnlyRecurring]);

    // Stats
    const totalRecurring = customersWithStats.filter(c => c.orderCount >= 2).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Clientes</h2>
                    <p className="text-gray-500 mt-1">
                        {!loading && !error && (
                            <>
                                {filteredCustomers.length} cliente{filteredCustomers.length !== 1 ? 's' : ''}
                                {showOnlyRecurring && ' recurrentes'}
                                {searchQuery && ` encontrado${filteredCustomers.length !== 1 ? 's' : ''}`}
                            </>
                        )}
                    </p>
                </div>

                {/* Search & Filters */}
                <div className="flex items-center gap-3">
                    {/* Recurring Filter */}
                    <button
                        onClick={() => setShowOnlyRecurring(!showOnlyRecurring)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${showOnlyRecurring
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <Star size={16} className={showOnlyRecurring ? 'fill-amber-500' : ''} />
                        <span className="text-sm font-medium hidden sm:inline">
                            Recurrentes ({totalRecurring})
                        </span>
                    </button>

                    {/* Search */}
                    <div className="relative w-full sm:w-64">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar clientes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg
                                     focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500
                                     transition-colors outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Error State */}
            {error && !loading && (
                <Card padding="lg">
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle size={32} className="text-red-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-800 mb-2">Error al cargar</h3>
                        <p className="text-gray-500 max-w-sm mb-4">{error}</p>
                        <button
                            onClick={fetchData}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                        >
                            Reintentar
                        </button>
                    </div>
                </Card>
            )}

            {/* Loading State */}
            {loading && (
                <Card padding="none">
                    <div className="divide-y divide-gray-100">
                        {[...Array(6)].map((_, i) => (
                            <CustomerRowSkeleton key={i} />
                        ))}
                    </div>
                </Card>
            )}

            {/* Empty State */}
            {!loading && !error && filteredCustomers.length === 0 && (
                <Card padding="lg">
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Users size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-800 mb-2">
                            {searchQuery || showOnlyRecurring ? 'Sin resultados' : 'No hay clientes'}
                        </h3>
                        <p className="text-gray-500 max-w-sm">
                            {searchQuery
                                ? `No se encontraron clientes que coincidan con "${searchQuery}"`
                                : showOnlyRecurring
                                    ? 'No hay clientes con 2 o más pedidos'
                                    : 'Los clientes de tu tienda aparecerán aquí'
                            }
                        </p>
                        {(searchQuery || showOnlyRecurring) && (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setShowOnlyRecurring(false);
                                }}
                                className="mt-4 px-4 py-2 text-sm font-medium text-rose-600 hover:text-rose-700"
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                </Card>
            )}

            {/* Customers List */}
            {!loading && !error && filteredCustomers.length > 0 && (
                <Card
                    padding="none"
                    header={
                        <CardHeader
                            title="Lista de Clientes"
                            subtitle={`${totalRecurring} clientes recurrentes (2+ pedidos)`}
                        />
                    }
                >
                    <div className="divide-y divide-gray-100">
                        {filteredCustomers.map(data => (
                            <CustomerRow
                                key={data.customer.id || data.customer.email}
                                data={data}
                                isExpanded={expandedCustomer === data.customer.email}
                                onToggle={() => setExpandedCustomer(
                                    expandedCustomer === data.customer.email ? null : data.customer.email || null
                                )}
                            />
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}
