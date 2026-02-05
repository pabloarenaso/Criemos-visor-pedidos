import { useEffect, useState, useMemo } from 'react';
import { Search, Package, AlertCircle, ImageOff, Grid3X3, List, Table2 } from 'lucide-react';
import { getProducts } from '../services/api';
import type { Product } from '../types/shopify';
import Card from '../components/Card';
import Badge from '../components/Badge';

// View mode type
type ViewMode = 'grid' | 'list' | 'table';

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

// Calculate total stock for a product
function getTotalStock(product: Product): number {
    return product.variants.reduce((sum, v) => sum + (v.inventoryQuantity || 0), 0);
}

// Product Card Skeleton
function ProductCardSkeleton({ viewMode }: { viewMode: ViewMode }) {
    if (viewMode === 'table') {
        return (
            <tr className="animate-pulse">
                <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-10"></div></td>
            </tr>
        );
    }

    if (viewMode === 'list') {
        return (
            <div className="flex items-center gap-4 p-3 border-b border-gray-100 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
            <div className="aspect-square bg-gray-200"></div>
            <div className="p-4 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
        </div>
    );
}

// Product Image component with fallback
function ProductImage({ product, size = 'md' }: { product: Product; size?: 'sm' | 'md' }) {
    const [imageError, setImageError] = useState(false);
    const imageSrc = product.image?.src || product.images?.[0]?.src;

    const sizeClasses = size === 'sm'
        ? 'w-12 h-12 rounded-lg'
        : 'aspect-square';

    if (!imageSrc || imageError) {
        return (
            <div className={`${sizeClasses} bg-gray-100 flex items-center justify-center`}>
                <ImageOff size={size === 'sm' ? 20 : 48} className="text-gray-300" />
            </div>
        );
    }

    return (
        <img
            src={imageSrc}
            alt={product.image?.alt || product.title}
            onError={() => setImageError(true)}
            className={`${sizeClasses} w-full object-cover`}
        />
    );
}

// Grid Card Component (compact)
function ProductGridCard({ product }: { product: Product }) {
    const totalStock = getTotalStock(product);
    const isOutOfStock = totalStock <= 0;
    const mainPrice = product.variants[0]?.price;

    return (
        <div
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden
                 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
        >
            {/* Product Image */}
            <div className="relative">
                <ProductImage product={product} />
                {isOutOfStock && (
                    <div className="absolute top-2 right-2">
                        <Badge variant="error" size="sm">Sin stock</Badge>
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="p-3 space-y-2">
                <h3 className="font-medium text-gray-900 text-sm line-clamp-2" title={product.title}>
                    {product.title}
                </h3>

                <div className="flex items-center justify-between">
                    {mainPrice && (
                        <p className="text-sm font-bold text-gray-900">
                            {formatCurrency(mainPrice)}
                        </p>
                    )}
                    <span className={`text-xs font-medium ${isOutOfStock ? 'text-red-500' : 'text-emerald-600'}`}>
                        {totalStock} uds
                    </span>
                </div>

                {product.variants.length > 1 && (
                    <p className="text-xs text-gray-400">
                        {product.variants.length} variantes
                    </p>
                )}
            </div>
        </div>
    );
}

// List Row Component
function ProductListRow({ product }: { product: Product }) {
    const totalStock = getTotalStock(product);
    const isOutOfStock = totalStock <= 0;
    const mainPrice = product.variants[0]?.price;

    return (
        <div className="flex items-center gap-4 p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
            <ProductImage product={product} size="sm" />

            <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 text-sm truncate" title={product.title}>
                    {product.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    {product.productType && <span>{product.productType}</span>}
                    {product.variants.length > 1 && (
                        <span>• {product.variants.length} variantes</span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4 flex-shrink-0">
                {mainPrice && (
                    <span className="font-semibold text-gray-900">
                        {formatCurrency(mainPrice)}
                    </span>
                )}
                <Badge
                    variant={isOutOfStock ? 'error' : 'success'}
                    size="sm"
                >
                    {totalStock} uds
                </Badge>
            </div>
        </div>
    );
}

// Table Row Component
function ProductTableRow({ product }: { product: Product }) {
    const totalStock = getTotalStock(product);
    const isOutOfStock = totalStock <= 0;
    const mainPrice = product.variants[0]?.price;
    const mainSku = product.variants[0]?.sku;

    return (
        <tr className="hover:bg-gray-50 transition-colors">
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                        <ProductImage product={product} size="sm" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate max-w-[200px]" title={product.title}>
                            {product.title}
                        </p>
                        {mainSku && (
                            <p className="text-xs text-gray-400">SKU: {mainSku}</p>
                        )}
                    </div>
                </div>
            </td>
            <td className="px-4 py-3 text-sm text-gray-600">
                {product.productType || '-'}
            </td>
            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                {mainPrice ? formatCurrency(mainPrice) : '-'}
            </td>
            <td className="px-4 py-3">
                <span className={`text-sm font-medium ${isOutOfStock ? 'text-red-500' : 'text-emerald-600'}`}>
                    {totalStock}
                </span>
            </td>
            <td className="px-4 py-3 text-sm text-gray-500">
                {product.variants.length}
            </td>
        </tr>
    );
}

// View Mode Selector
function ViewModeSelector({
    viewMode,
    onChange
}: {
    viewMode: ViewMode;
    onChange: (mode: ViewMode) => void;
}) {
    const modes: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
        { mode: 'grid', icon: <Grid3X3 size={18} />, label: 'Iconos' },
        { mode: 'list', icon: <List size={18} />, label: 'Lista' },
        { mode: 'table', icon: <Table2 size={18} />, label: 'Tabla' },
    ];

    return (
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
            {modes.map(({ mode, icon, label }) => (
                <button
                    key={mode}
                    onClick={() => onChange(mode)}
                    title={label}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === mode
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    {icon}
                    <span className="hidden sm:inline">{label}</span>
                </button>
            ))}
        </div>
    );
}

export default function Productos() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        const saved = localStorage.getItem('products_view_mode');
        return (saved as ViewMode) || 'grid';
    });

    // Save view mode preference
    const handleViewModeChange = (mode: ViewMode) => {
        setViewMode(mode);
        localStorage.setItem('products_view_mode', mode);
    };

    // Fetch products
    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getProducts();
            setProducts(response.data || []);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error al cargar productos';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // Filter products by search query
    const filteredProducts = useMemo(() => {
        if (!searchQuery.trim()) return products;

        const query = searchQuery.toLowerCase();
        return products.filter(product =>
            product.title.toLowerCase().includes(query) ||
            product.productType?.toLowerCase().includes(query) ||
            product.vendor?.toLowerCase().includes(query) ||
            product.variants.some(v => v.sku?.toLowerCase().includes(query))
        );
    }, [products, searchQuery]);

    // Empty state component
    const EmptyState = () => (
        <div className="flex flex-col items-center justify-center py-16 text-center col-span-full">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Package size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">
                {searchQuery ? 'Sin resultados' : 'No hay productos'}
            </h3>
            <p className="text-gray-500 max-w-sm">
                {searchQuery
                    ? `No se encontraron productos que coincidan con "${searchQuery}"`
                    : 'Los productos de tu tienda Shopify aparecerán aquí.'
                }
            </p>
            {searchQuery && (
                <button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 px-4 py-2 text-sm font-medium text-rose-600 hover:text-rose-700"
                >
                    Limpiar búsqueda
                </button>
            )}
        </div>
    );

    // Error state component
    const ErrorState = () => (
        <div className="flex flex-col items-center justify-center py-16 text-center col-span-full">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <AlertCircle size={32} className="text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Error al cargar</h3>
            <p className="text-gray-500 max-w-sm mb-4">{error}</p>
            <button
                onClick={fetchProducts}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
                Reintentar
            </button>
        </div>
    );

    // Render products based on view mode
    const renderProducts = () => {
        if (viewMode === 'table') {
            return (
                <Card padding="none">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Producto</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Precio</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Stock</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Variantes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading
                                    ? [...Array(8)].map((_, i) => <ProductCardSkeleton key={i} viewMode="table" />)
                                    : filteredProducts.map(product => (
                                        <ProductTableRow key={product.id} product={product} />
                                    ))
                                }
                            </tbody>
                        </table>
                    </div>
                </Card>
            );
        }

        if (viewMode === 'list') {
            return (
                <Card padding="none">
                    {loading
                        ? [...Array(8)].map((_, i) => <ProductCardSkeleton key={i} viewMode="list" />)
                        : filteredProducts.map(product => (
                            <ProductListRow key={product.id} product={product} />
                        ))
                    }
                </Card>
            );
        }

        // Grid view
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {loading
                    ? [...Array(10)].map((_, i) => <ProductCardSkeleton key={i} viewMode="grid" />)
                    : filteredProducts.map(product => (
                        <ProductGridCard key={product.id} product={product} />
                    ))
                }
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Productos</h2>
                    <p className="text-gray-500 mt-1">
                        {!loading && !error && `${filteredProducts.length} producto${filteredProducts.length !== 1 ? 's' : ''}`}
                        {!loading && !error && searchQuery && ` encontrado${filteredProducts.length !== 1 ? 's' : ''}`}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* View Mode Selector */}
                    <ViewModeSelector viewMode={viewMode} onChange={handleViewModeChange} />

                    {/* Search Bar */}
                    <div className="relative w-full sm:w-64">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar productos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg
                           focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500
                           transition-colors outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Error State */}
            {error && !loading && (
                <Card padding="lg">
                    <ErrorState />
                </Card>
            )}

            {/* Empty State */}
            {!loading && !error && filteredProducts.length === 0 && (
                <Card padding="lg">
                    <EmptyState />
                </Card>
            )}

            {/* Products */}
            {(!loading || viewMode !== 'grid') && !error && (filteredProducts.length > 0 || loading) && renderProducts()}
            {loading && viewMode === 'grid' && renderProducts()}
        </div>
    );
}
