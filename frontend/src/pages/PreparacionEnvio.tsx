import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Edit3,
    Check,
    X,
    AlertCircle,
    Printer,
    RotateCcw,
    MapPin,
    Phone,
    FileText,
    Clock,
    Lock,
    Unlock,
    Search,
    ChevronUp,
    ChevronDown,
} from 'lucide-react';
import { getOrders } from '../services/api';
import type { Order } from '../types/shopify';
import { calculateShippingDate } from '../utils/shippingUtils';
import Card from '../components/Card';
import Badge from '../components/Badge';
import {
    type EditedAddress,
    saveEditedAddress,
    getStoredEdit,
    hasEditedAddress,
    revertToOriginal,
    formatAddressForDisplay,
} from '../utils/addressStorage';
import { useResizable } from '../hooks/useResizable';

// Resize Handle Component
const ResizeHandle = ({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) => (
    <div
        onMouseDown={onMouseDown}
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-rose-400 active:bg-rose-600 transition-colors z-10"
        title="Ajustar ancho"
    />
);

// Convert Shopify address to our format
function toEditedAddress(shopifyAddress: Order['shippingAddress']): EditedAddress | null {
    if (!shopifyAddress) return null;
    return {
        firstName: shopifyAddress.firstName || '',
        lastName: shopifyAddress.lastName || '',
        address1: shopifyAddress.address1 || '',
        address2: shopifyAddress.address2 || '',
        city: shopifyAddress.city || '',
        province: shopifyAddress.province || '',
        zip: shopifyAddress.zip || '',
        phone: shopifyAddress.phone || '',
    };
}

// Get full name from address
function getFullName(address: EditedAddress | null): string {
    if (!address) return '';
    return `${address.firstName || ''} ${address.lastName || ''}`.trim();
}

// Format timestamp
function formatTimestamp(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return 'Ayer';
    return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
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

// Loading skeleton row
function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            <td className="px-4 py-3"><div className="w-4 h-4 bg-gray-200 rounded"></div></td>
            <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
            <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
            <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
            <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-48"></div></td>
            <td className="px-4 py-3"><div className="h-6 bg-gray-200 rounded w-24"></div></td>
            <td className="px-4 py-3"><div className="h-6 bg-gray-200 rounded w-24"></div></td>
            <td className="px-4 py-3"><div className="h-8 bg-gray-200 rounded w-24"></div></td>
        </tr>
    );
}

// Address Edit Modal
interface AddressModalProps {
    order: Order;
    onClose: () => void;
    onSave: () => void;
}

function AddressEditModal({ order, onClose, onSave }: AddressModalProps) {
    const originalAddress = toEditedAddress(order.shippingAddress);
    const storedEdit = getStoredEdit(order.id);

    // Get full name from original or stored
    const originalFullName = getFullName(originalAddress);
    const storedFullName = storedEdit?.address
        ? getFullName(storedEdit.address)
        : originalFullName;

    const [formData, setFormData] = useState<EditedAddress>(
        storedEdit?.address || originalAddress || {
            firstName: '',
            lastName: '',
            address1: '',
            address2: '',
            city: '',
            province: '',
            zip: '',
            phone: '',
            notes: '',
        }
    );
    const [fullName, setFullName] = useState(storedFullName);
    const [isNameEditable, setIsNameEditable] = useState(false);
    const [notes, setNotes] = useState(storedEdit?.address.notes || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!originalAddress) return;

        // Split full name into first and last name
        const nameParts = fullName.trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const addressToSave: EditedAddress = {
            ...formData,
            firstName,
            lastName,
            notes,
        };

        saveEditedAddress(order.id, addressToSave, originalAddress);
        onSave();
        onClose();
    };

    const handleRevert = () => {
        revertToOriginal(order.id);
        onSave();
        onClose();
    };

    const hasChanges = storedEdit !== null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                            Editar Dirección - {order.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Los cambios son solo locales, no se envían a Shopify
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Original Address (Read Only) */}
                        <div className="space-y-3">
                            <h4 className="font-medium text-gray-700 flex items-center gap-2">
                                <MapPin size={18} className="text-gray-400" />
                                Dirección Original (Shopify)
                            </h4>
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                {originalAddress ? (
                                    <div className="space-y-2 text-sm">
                                        <p className="font-medium">{originalFullName}</p>
                                        <p>{originalAddress.address1}</p>
                                        {originalAddress.address2 && <p>{originalAddress.address2}</p>}
                                        <p>{originalAddress.city}, {originalAddress.province}</p>
                                        <p>{originalAddress.zip}</p>
                                        {originalAddress.phone && (
                                            <p className="flex items-center gap-1 text-gray-500">
                                                <Phone size={14} /> {originalAddress.phone}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-gray-400">Sin dirección de envío</p>
                                )}
                            </div>
                        </div>

                        {/* Editable Form */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium text-gray-700 flex items-center gap-2">
                                    <Edit3 size={18} className="text-blue-500" />
                                    Dirección Corregida
                                </h4>
                                {hasChanges && (
                                    <div className="flex items-center gap-2">
                                        <Badge variant="warning" size="sm">Modificado</Badge>
                                        {storedEdit && (
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <Clock size={12} />
                                                {formatTimestamp(storedEdit.timestamp)}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-3">
                                {/* Full Name Field */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-xs font-medium text-gray-600">
                                            Nombre del destinatario
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setIsNameEditable(!isNameEditable)}
                                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${isNameEditable
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                }`}
                                        >
                                            {isNameEditable ? (
                                                <>
                                                    <Unlock size={12} />
                                                    Editando
                                                </>
                                            ) : (
                                                <>
                                                    <Lock size={12} />
                                                    Desbloquear
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        disabled={!isNameEditable}
                                        className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition-colors ${isNameEditable
                                            ? 'border-blue-300 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                                            : 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
                                            }`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Calle y número</label>
                                    <input
                                        type="text"
                                        value={formData.address1}
                                        onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Depto/Casa (opcional)</label>
                                    <input
                                        type="text"
                                        value={formData.address2 || ''}
                                        onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Ciudad/Comuna</label>
                                        <input
                                            type="text"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Región</label>
                                        <input
                                            type="text"
                                            value={formData.province}
                                            onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Código postal</label>
                                        <input
                                            type="text"
                                            value={formData.zip}
                                            onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
                                        <input
                                            type="text"
                                            value={formData.phone || ''}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                                        <FileText size={14} /> Notas adicionales (opcional)
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={2}
                                        placeholder="Ej: Entregar al portero, tocar timbre 2 veces..."
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                                    />
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <div>
                        {hasChanges && (
                            <button
                                onClick={handleRevert}
                                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <RotateCcw size={16} />
                                Revertir a original
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                            <Check size={16} />
                            Guardar cambios
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PreparacionEnvio() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [sortBy, setSortBy] = useState<'purchase' | 'dispatch'>('dispatch');
    const [, forceUpdate] = useState({});

    // Resizable Columns
    const { columnWidths, onMouseDown } = useResizable({
        checkbox: 48,
        order: 100,
        customer: 180,
        product: 200,
        address: 250, // Wider for address editing
        dispatch: 120,
        status: 100,
        actions: 100
    });

    // Filter orders based on search term
    const filteredOrders = useMemo(() => {
        const filtered = orders.filter(order => {
            const searchLower = searchTerm.toLowerCase();
            const orderName = (order.name || '').toLowerCase();
            const customerName = `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.toLowerCase();
            const customerEmail = (order.customer?.email || '').toLowerCase();

            return orderName.includes(searchLower) ||
                customerName.includes(searchLower) ||
                customerEmail.includes(searchLower);
        });

        return filtered.sort((a, b) => {
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
    }, [orders, searchTerm, sortBy, sortOrder]);

    // Fetch only unfulfilled orders
    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getOrders();
            const allOrders = response.data || [];
            // Filter only unfulfilled orders
            const unfulfilled = allOrders.filter(
                o => !o.fulfillmentStatus || o.fulfillmentStatus === 'unfulfilled'
            );
            setOrders(unfulfilled);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error al cargar pedidos';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Count edited addresses
    const editedCount = useMemo(() => {
        return orders.filter(o => hasEditedAddress(o.id)).length;
    }, [orders]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
        } else {
            setSelectedOrders(new Set());
        }
    };

    const handleSelectOrder = (orderId: number) => {
        const newSelected = new Set(selectedOrders);
        if (newSelected.has(orderId)) {
            newSelected.delete(orderId);
        } else {
            newSelected.add(orderId);
        }
        setSelectedOrders(newSelected);
    };

    const handleSaveAddress = () => {
        forceUpdate({});
    };

    const getDisplayAddress = (order: Order): string => {
        const storedEdit = getStoredEdit(order.id);
        if (storedEdit) {
            return formatAddressForDisplay(storedEdit.address);
        }
        return formatAddressForDisplay(toEditedAddress(order.shippingAddress));
    };

    const getEditTimestamp = (orderId: number): string | null => {
        const stored = getStoredEdit(orderId);
        return stored?.timestamp || null;
    };

    // Error state
    const ErrorState = () => (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <AlertCircle size={32} className="text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Error al cargar</h3>
            <p className="text-gray-500 max-w-sm mb-4">{error}</p>
            <button
                onClick={fetchOrders}
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
                    <h2 className="text-2xl font-bold text-gray-800">Preparar Envío</h2>
                    <p className="text-gray-500 mt-1">
                        {!loading && !error && (
                            <>
                                {orders.length} pedido{orders.length !== 1 ? 's' : ''} pendiente{orders.length !== 1 ? 's' : ''}
                                {editedCount > 0 && (
                                    <span className="ml-2 text-amber-600">
                                        • {editedCount} con dirección modificada
                                    </span>
                                )}
                            </>
                        )}
                    </p>
                </div>

                {selectedOrders.size > 0 && (
                    <button
                        onClick={() => {
                            const orderNames = orders
                                .filter(o => selectedOrders.has(o.id))
                                .map(o => o.name?.replace('#', '') || o.id)
                                .join(',');
                            navigate(`/impresion-etiquetas?orders=${orderNames}`);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 
                       bg-gradient-to-r from-rose-500 to-purple-500 
                       text-white rounded-lg font-medium shadow-md 
                       hover:shadow-lg transition-all duration-200"
                    >
                        <Printer size={18} />
                        Preparar etiquetas ({selectedOrders.size})
                    </button>
                )}
            </div>

            {/* Orders Table */}
            <Card padding="none">
                {/* Table Header with Search */}
                <div className="bg-gradient-to-r from-gray-50 to-slate-100 px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="font-semibold text-gray-800 text-lg">Pedidos Pendientes de Envío</h3>
                        <p className="text-sm text-gray-500">Selecciona y edita direcciones antes de imprimir</p>
                    </div>

                    {/* Search Bar */}
                    <div className="relative max-w-sm w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar por orden o cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg 
                                     text-sm placeholder-gray-400 focus:outline-none focus:ring-2 
                                     focus:ring-rose-500/20 focus:border-rose-500 transition-all bg-white"
                        />
                    </div>
                </div>

                {error && !loading && <ErrorState />}

                {loading && (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 w-12"></th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Orden</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cliente</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Producto</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Dirección</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase text-rose-600 font-bold">Despacho</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && !error && filteredOrders.length === 0 && (
                    <div className="py-20 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
                            <Search size={24} className="text-gray-300" />
                        </div>
                        <h3 className="text-gray-900 font-medium">No se encontraron resultados</h3>
                        <p className="text-gray-500 text-sm mt-1">Intenta con otro número de orden o nombre de cliente.</p>
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="mt-4 text-rose-500 font-medium text-sm hover:underline"
                            >
                                Limpiar búsqueda
                            </button>
                        )}
                    </div>
                )}

                {!loading && !error && filteredOrders.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full relative" style={{ tableLayout: 'fixed' }}>
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="relative px-4 py-3 w-12 overflow-hidden" style={{ width: columnWidths.checkbox }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                            className="w-4 h-4 text-rose-500 border-gray-300 rounded focus:ring-rose-500"
                                        />
                                    </th>
                                    <th className="relative px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase overflow-hidden text-ellipsis"
                                        style={{ width: columnWidths.order }}>
                                        <button
                                            onClick={() => {
                                                if (sortBy === 'purchase') {
                                                    setSortOrder(s => s === 'desc' ? 'asc' : 'desc');
                                                } else {
                                                    setSortBy('purchase');
                                                    setSortOrder('asc');
                                                }
                                            }}
                                            className={`hover:text-gray-900 flex items-center gap-1 ${sortBy === 'purchase' ? 'text-gray-900 font-bold' : ''}`}
                                        >
                                            ORDEN
                                            {sortBy === 'purchase' && (sortOrder === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />)}
                                        </button>
                                        <ResizeHandle onMouseDown={(e) => onMouseDown(e, 'order')} />
                                    </th>
                                    <th className="relative px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase overflow-hidden text-ellipsis"
                                        style={{ width: columnWidths.customer }}>
                                        CLIENTE
                                        <ResizeHandle onMouseDown={(e) => onMouseDown(e, 'customer')} />
                                    </th>
                                    <th className="relative px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase overflow-hidden text-ellipsis"
                                        style={{ width: columnWidths.product }}>
                                        PRODUCTO
                                        <ResizeHandle onMouseDown={(e) => onMouseDown(e, 'product')} />
                                    </th>
                                    <th className="relative px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase overflow-hidden text-ellipsis"
                                        style={{ width: columnWidths.address }}>
                                        DIRECCIÓN
                                        <ResizeHandle onMouseDown={(e) => onMouseDown(e, 'address')} />
                                    </th>
                                    <th className="relative px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase overflow-hidden"
                                        style={{ width: columnWidths.dispatch }}>
                                        <button
                                            onClick={() => {
                                                if (sortBy === 'dispatch') {
                                                    setSortOrder(s => s === 'desc' ? 'asc' : 'desc');
                                                } else {
                                                    setSortBy('dispatch');
                                                    setSortOrder('asc');
                                                }
                                            }}
                                            className={`hover:text-rose-700 flex items-center gap-1 font-bold ${sortBy === 'dispatch' ? 'text-rose-600 border-b border-rose-400' : 'text-rose-400'}`}
                                        >
                                            FECHA DESPACHO
                                            {sortBy === 'dispatch' && (sortOrder === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />)}
                                        </button>
                                        <ResizeHandle onMouseDown={(e) => onMouseDown(e, 'dispatch')} />
                                    </th>
                                    <th className="relative px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase overflow-hidden"
                                        style={{ width: columnWidths.status }}>
                                        ESTADO
                                        <ResizeHandle onMouseDown={(e) => onMouseDown(e, 'status')} />
                                    </th>
                                    <th className="relative px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase overflow-hidden"
                                        style={{ width: columnWidths.actions }}>
                                        ACCIONES
                                        <ResizeHandle onMouseDown={(e) => onMouseDown(e, 'actions')} />
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredOrders.map((order) => {
                                    const isEdited = hasEditedAddress(order.id);
                                    const isSelected = selectedOrders.has(order.id);
                                    const editTimestamp = getEditTimestamp(order.id);
                                    const shippingDate = calculateShippingDate(order.createdAt, order.lineItems);
                                    const primaryItem = order.lineItems[0];

                                    return (
                                        <tr
                                            key={order.id}
                                            className={`
                                                transition-colors duration-150 text-sm
                                                ${isEdited ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-gray-50'}
                                                ${isSelected ? 'bg-rose-50/30' : ''}
                                            `}
                                        >
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleSelectOrder(order.id)}
                                                    className="w-4 h-4 text-rose-500 border-gray-300 rounded focus:ring-rose-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-semibold text-gray-900">{order.name}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {order.customer ? (
                                                    <div>
                                                        <p className="text-gray-900 font-medium">{order.customer.firstName} {order.customer.lastName}</p>
                                                        <p className="text-[11px] text-gray-500">{order.customer.email}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">Sin cliente</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 min-w-[150px]">
                                                {primaryItem ? (
                                                    <div>
                                                        <p className="text-gray-900 font-medium line-clamp-1">{primaryItem.title}</p>
                                                        <p className="text-[11px] text-gray-500 italic">
                                                            {primaryItem.variantTitle || 'Sin modelo'}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className={`text-sm ${isEdited ? 'text-amber-800' : 'text-gray-600'} line-clamp-1`}>
                                                    {getDisplayAddress(order)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-rose-600 font-bold">
                                                        {formatDispatchDate(shippingDate).date}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 uppercase tracking-tighter">
                                                        {formatDispatchDate(shippingDate).day}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {isEdited ? (
                                                    <div className="space-y-1">
                                                        <Badge variant="warning" size="sm">
                                                            Modificado
                                                        </Badge>
                                                        {editTimestamp && (
                                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                                <Clock size={10} />
                                                                {formatTimestamp(editTimestamp)}
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => setEditingOrder(order)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 
                                                     text-sm font-medium text-blue-600 
                                                     bg-blue-50 hover:bg-blue-100 
                                                     rounded-lg transition-colors"
                                                >
                                                    <Edit3 size={14} />
                                                    Editar
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

            {/* Edit Modal */}
            {editingOrder && (
                <AddressEditModal
                    order={editingOrder}
                    onClose={() => setEditingOrder(null)}
                    onSave={handleSaveAddress}
                />
            )}
        </div>
    );
}
