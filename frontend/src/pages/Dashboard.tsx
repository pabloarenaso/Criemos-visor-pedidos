import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    ShoppingBag,
    Package,
    Users,
    DollarSign,
    TrendingUp,
    Clock,
    Truck,
    ArrowRight,
    RefreshCw,
    AlertCircle,
} from 'lucide-react';
import { getOrders, getProducts, getCustomers } from '../services/api';
import type { Order, Product, Customer } from '../types/shopify';
import Card from '../components/Card';
import Badge from '../components/Badge';

// Format currency
function formatCurrency(amount: string | number): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
    }).format(num);
}

// Format relative time
function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
}

// Stat Card Component
interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    trend?: { value: number; label: string };
    color: 'rose' | 'blue' | 'emerald' | 'amber' | 'purple';
    loading?: boolean;
}

function StatCard({ title, value, subtitle, icon, trend, color, loading }: StatCardProps) {
    const colorClasses = {
        rose: 'from-rose-500 to-pink-500 bg-rose-50',
        blue: 'from-blue-500 to-cyan-500 bg-blue-50',
        emerald: 'from-emerald-500 to-teal-500 bg-emerald-50',
        amber: 'from-amber-500 to-orange-500 bg-amber-50',
        purple: 'from-purple-500 to-violet-500 bg-purple-50',
    };

    return (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    {loading ? (
                        <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mt-2"></div>
                    ) : (
                        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                    )}
                    {subtitle && !loading && (
                        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
                    )}
                    {trend && !loading && (
                        <div className={`flex items-center gap-1 mt-2 text-xs ${trend.value >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            <TrendingUp size={12} className={trend.value < 0 ? 'rotate-180' : ''} />
                            <span>{trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}</span>
                        </div>
                    )}
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color].split(' ')[0]} ${colorClasses[color].split(' ')[1]} flex items-center justify-center flex-shrink-0`}>
                    <div className="text-white">{icon}</div>
                </div>
            </div>
        </div>
    );
}

// Recent Order Row
function RecentOrderRow({ order }: { order: Order }) {
    const isPending = !order.fulfillmentStatus || order.fulfillmentStatus === 'unfulfilled';

    return (
        <Link
            to={`/pedidos/${order.id}`}
            className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 transition-colors rounded-lg -mx-2"
        >
            <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isPending ? 'bg-amber-100' : 'bg-emerald-100'
                    }`}>
                    {isPending ? (
                        <Clock size={18} className="text-amber-600" />
                    ) : (
                        <Truck size={18} className="text-emerald-600" />
                    )}
                </div>
                <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                        {order.name}
                        {order.customer && (
                            <span className="text-gray-500 font-normal ml-2">
                                {order.customer.firstName} {order.customer.lastName}
                            </span>
                        )}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                        {order.lineItems?.length || 0} producto{order.lineItems?.length !== 1 ? 's' : ''} •
                        {formatRelativeTime(order.createdAt)}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
                <span className="font-semibold text-gray-900">
                    {formatCurrency(order.totalPrice)}
                </span>
                <Badge
                    variant={isPending ? 'warning' : 'success'}
                    size="sm"
                >
                    {isPending ? 'Pendiente' : 'Enviado'}
                </Badge>
            </div>
        </Link>
    );
}

export default function Dashboard() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [ordersRes, productsRes, customersRes] = await Promise.all([
                getOrders(),
                getProducts(),
                getCustomers(),
            ]);

            setOrders(ordersRes.data || []);
            setProducts(productsRes.data || []);
            setCustomers(customersRes.data || []);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error al cargar datos';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Calculate statistics
    const stats = useMemo(() => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Orders today
        const todayOrders = orders.filter(o => new Date(o.createdAt) >= todayStart);
        const todayRevenue = todayOrders.reduce((sum, o) => sum + parseFloat(o.totalPrice || '0'), 0);

        // Pending orders
        const pendingOrders = orders.filter(o => !o.fulfillmentStatus || o.fulfillmentStatus === 'unfulfilled');

        // Weekly revenue
        const weeklyOrders = orders.filter(o => new Date(o.createdAt) >= weekAgo);
        const weeklyRevenue = weeklyOrders.reduce((sum, o) => sum + parseFloat(o.totalPrice || '0'), 0);

        // Active products (with stock)
        const activeProducts = products.filter(p =>
            p.variants.some(v => (v.inventoryQuantity || 0) > 0)
        );

        // Recurring customers (2+ orders)
        const customerOrderCount: Record<string, number> = {};
        orders.forEach(o => {
            if (o.customer?.email) {
                customerOrderCount[o.customer.email] = (customerOrderCount[o.customer.email] || 0) + 1;
            }
        });
        const recurringCustomers = Object.values(customerOrderCount).filter(count => count >= 2).length;

        return {
            todayOrders: todayOrders.length,
            todayRevenue,
            pendingOrders: pendingOrders.length,
            weeklyRevenue,
            totalProducts: products.length,
            activeProducts: activeProducts.length,
            totalCustomers: customers.length,
            recurringCustomers,
        };
    }, [orders, products, customers]);

    // Recent orders (last 5)
    const recentOrders = useMemo(() => {
        return [...orders]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);
    }, [orders]);

    // Low stock products
    const lowStockProducts = useMemo(() => {
        return products
            .map(p => ({
                product: p,
                totalStock: p.variants.reduce((sum, v) => sum + (v.inventoryQuantity || 0), 0),
            }))
            .filter(p => p.totalStock > 0 && p.totalStock <= 5)
            .sort((a, b) => a.totalStock - b.totalStock)
            .slice(0, 5);
    }, [products]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
                    <p className="text-gray-500 mt-1">Resumen de tu tienda Criemos</p>
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
                             text-gray-600 bg-white border border-gray-200 rounded-lg
                             hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Actualizar
                </button>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                    <button
                        onClick={fetchData}
                        className="text-sm font-medium text-red-600 hover:text-red-700"
                    >
                        Reintentar
                    </button>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Pedidos Hoy"
                    value={stats.todayOrders}
                    subtitle={`${formatCurrency(stats.todayRevenue)} en ventas`}
                    icon={<ShoppingBag size={22} />}
                    color="rose"
                    loading={loading}
                />
                <StatCard
                    title="Pendientes de Envío"
                    value={stats.pendingOrders}
                    subtitle="Requieren atención"
                    icon={<Clock size={22} />}
                    color="amber"
                    loading={loading}
                />
                <StatCard
                    title="Ingresos Semana"
                    value={formatCurrency(stats.weeklyRevenue)}
                    subtitle="Últimos 7 días"
                    icon={<DollarSign size={22} />}
                    color="emerald"
                    loading={loading}
                />
                <StatCard
                    title="Productos Activos"
                    value={stats.activeProducts}
                    subtitle={`de ${stats.totalProducts} productos`}
                    icon={<Package size={22} />}
                    color="blue"
                    loading={loading}
                />
            </div>

            {/* Second Row Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard
                    title="Total Clientes"
                    value={stats.totalCustomers}
                    subtitle={`${stats.recurringCustomers} recurrentes`}
                    icon={<Users size={22} />}
                    color="purple"
                    loading={loading}
                />
                <Link to="/preparar-envio" className="block">
                    <div className="bg-gradient-to-r from-rose-500 to-purple-500 rounded-xl p-5 text-white hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-white/80">Preparar Envíos</p>
                                <p className="text-2xl font-bold mt-1">{stats.pendingOrders} pendientes</p>
                                <p className="text-xs text-white/70 mt-1">Ir a preparación de etiquetas</p>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <Truck size={24} />
                            </div>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <Card padding="none">
                    <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-800">Pedidos Recientes</h3>
                            <Link
                                to="/pedidos"
                                className="text-sm font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1"
                            >
                                Ver todos <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>
                    <div className="p-2">
                        {loading ? (
                            <div className="space-y-3 p-2">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 animate-pulse">
                                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : recentOrders.length === 0 ? (
                            <div className="py-8 text-center text-gray-400">
                                No hay pedidos recientes
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {recentOrders.map(order => (
                                    <RecentOrderRow key={order.id} order={order} />
                                ))}
                            </div>
                        )}
                    </div>
                </Card>

                {/* Low Stock Alert */}
                <Card padding="none">
                    <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-800">Alertas de Stock</h3>
                            <Link
                                to="/productos"
                                className="text-sm font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1"
                            >
                                Ver productos <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>
                    <div className="p-4">
                        {loading ? (
                            <div className="space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 animate-pulse">
                                        <div className="w-8 h-8 bg-gray-200 rounded"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : lowStockProducts.length === 0 ? (
                            <div className="py-8 text-center">
                                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Package size={22} className="text-emerald-600" />
                                </div>
                                <p className="text-gray-500">Todo el inventario está en orden</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {lowStockProducts.map(({ product, totalStock }) => (
                                    <div
                                        key={product.id}
                                        className="flex items-center gap-3 p-2 rounded-lg bg-amber-50/50"
                                    >
                                        <div className="w-8 h-8 bg-amber-100 rounded flex items-center justify-center">
                                            <AlertCircle size={16} className="text-amber-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {product.title}
                                            </p>
                                            <p className="text-xs text-amber-700">
                                                Solo {totalStock} unidad{totalStock !== 1 ? 'es' : ''} en stock
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
