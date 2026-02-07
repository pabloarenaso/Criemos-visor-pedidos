import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Printer,
    ArrowLeft,
    Check,
    Package,
    Edit3,
} from 'lucide-react';
import { getOrders } from '../services/api';
import type { Order } from '../types/shopify';
import {
    type EditedAddress,
    getStoredEdit,
    hasEditedAddress,
} from '../utils/addressStorage';

// Paper sizes in mm
const PAPER_SIZES = {
    carta: { width: 216, height: 279, name: 'Carta (216x279mm)' },
    oficio: { width: 216, height: 330, name: 'Oficio (216x330mm)' },
    a4: { width: 210, height: 297, name: 'A4 (210x297mm)' },
};

// Convert Shopify address to EditedAddress format
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

// Get address to display (edited or original)
function getDisplayAddress(order: Order): EditedAddress | null {
    const stored = getStoredEdit(order.id);
    if (stored) return stored.address;

    const converted = toEditedAddress(order.shippingAddress);
    if (converted) {
        // Fallback for name if missing in shipping address
        if (!converted.firstName && !converted.lastName && order.customer) {
            converted.firstName = order.customer.firstName || '';
            converted.lastName = order.customer.lastName || '';
        }
    }
    return converted;
}

// Format currency
function formatCurrency(value: string | number): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
    }).format(num);
}

// Single Label Component
import { formatRUT } from '../utils/formatters';

interface LabelProps {
    order: Order;
    showProducts: boolean;
    compact?: boolean;
}

function ShippingLabel({ order, showProducts, compact }: LabelProps) {
    const address = getDisplayAddress(order);
    const isEdited = hasEditedAddress(order.id);
    const itemCount = order.lineItems?.length || 0;

    // Helper to find RUT
    const rutAttribute = order.note_attributes?.find(attr =>
        ['rut', 'RUT', 'run', 'RUN', 'tax_id', 'Tax ID'].includes(attr.name)
    );
    const rut = rutAttribute?.value || order.shippingAddress?.company;

    // Compact Mode (12 per page)
    if (compact) {
        return (
            <div className="label-container bg-white border border-gray-400 overflow-hidden text-xs relative"
                style={{ width: '100%', height: '100%', pageBreakInside: 'avoid' }}>
                <div className="p-2 h-full flex flex-col justify-between">
                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-gray-200 pb-0.5 mb-1">
                        <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-sm leading-none">{order.name}</span>
                            <span className="text-[9px] text-gray-500 leading-none">{new Date().toLocaleDateString('es-CL')}</span>
                        </div>
                        <span className="font-bold text-xs leading-none">Criemos</span>
                    </div>



                    {/* Address */}
                    {/* Address / Customer Details */}
                    <div className="flex-1 min-h-0 container-details">
                        {address ? (
                            <div className="space-y-0.5 text-[10px] leading-tight text-gray-800">
                                {/* 1. Nombre */}
                                <p className="font-bold truncate">
                                    {address.firstName} {address.lastName}
                                </p>

                                {/* 2. RUT */}
                                {rut && (
                                    <p className="truncate">
                                        <span className="font-bold">RUT:</span> {formatRUT(rut)}
                                    </p>
                                )}

                                {/* 3. Dirección */}
                                <p className="truncate text-gray-600">{address.address1} {address.address2}</p>
                                <p className="truncate text-gray-600">{address.city}, {address.province}</p>

                                {/* 4. Teléfono */}
                                <p className="truncate text-gray-600">
                                    <span className="font-bold">Teléfono:</span> {address.phone}
                                </p>

                                {/* 5. Email */}
                                <p className="truncate text-gray-600" title={order.email || order.customer?.email}>
                                    {order.email || order.customer?.email || ''}
                                </p>
                            </div>
                        ) : (
                            <p className="text-gray-400 italic text-[10px]">Sin dirección</p>
                        )}
                    </div>

                    {/* Products Summary */}
                    {showProducts && itemCount > 0 && (
                        <div className="mt-1 pt-1 border-t border-gray-200 text-[10px] text-gray-700">
                            <div className="line-clamp-2">
                                {order.lineItems.map(i => `${i.quantity}x ${i.title}`).join(', ')}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Standard Label
    return (
        <div className="label-container bg-white border-2 border-gray-800 rounded-lg overflow-hidden"
            style={{ width: '100mm', height: '150mm', pageBreakAfter: 'always' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-900 text-white">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-rose-400 to-purple-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">C</span>
                    </div>
                    <span className="font-bold text-lg">Criemos</span>
                </div>
                <div className="text-right">
                    <div className="font-bold text-lg leading-tight">{order.name}</div>

                    <div className="text-xs text-gray-300">
                        {new Date().toLocaleDateString('es-CL')}
                    </div>
                </div>
            </div>

            {/* Recipient Section */}
            <div className="px-4 py-3 border-b border-gray-300 mobile-recipient-section">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                        Destinatario
                    </span>
                    {isEdited && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">
                            <Edit3 size={10} /> Editada
                        </span>
                    )}
                </div>

                {address ? (
                    <div className="space-y-1 text-sm text-gray-800">
                        {/* 1. Nombre */}
                        <p className="font-bold text-lg text-gray-900">
                            {address.firstName} {address.lastName}
                        </p>

                        {/* 2. RUT */}
                        {rut && (
                            <p className="font-bold">RUT: {formatRUT(rut)}</p>
                        )}

                        {/* 3. Dirección */}
                        <p className="text-gray-700">{address.address1}</p>
                        {address.address2 && (
                            <p className="text-gray-700">{address.address2}</p>
                        )}
                        <p className="text-gray-700">
                            {address.city}, {address.province}
                        </p>
                        {address.zip && (
                            <p className="text-gray-600">CP: {address.zip}</p>
                        )}

                        {/* 4. Teléfono */}
                        {address.phone && (
                            <p className="text-gray-600">
                                <span className="font-bold">Teléfono:</span> {address.phone}
                            </p>
                        )}

                        {/* 5. Email */}
                        {(order.email || order.customer?.email) && (
                            <p className="text-gray-600 truncate font-medium mt-1">
                                {order.email || order.customer?.email}
                            </p>
                        )}
                    </div>
                ) : (
                    <p className="text-gray-400 italic">Sin dirección de envío</p>
                )}
            </div>

            {/* Products Section */}
            {showProducts && order.lineItems && order.lineItems.length > 0 && (
                <div className="px-4 py-2 border-b border-gray-300 bg-gray-50">
                    <div className="flex items-center gap-2 mb-1">
                        <Package size={14} className="text-gray-500" />
                        <span className="text-xs font-bold text-gray-500 uppercase">
                            Productos ({itemCount})
                        </span>
                    </div>
                    <div className="space-y-0.5 text-xs text-gray-700 max-h-16 overflow-hidden">
                        {order.lineItems.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="truncate">
                                {item.quantity}x {item.title}
                            </div>
                        ))}
                        {order.lineItems.length > 3 && (
                            <div className="text-gray-400">
                                +{order.lineItems.length - 3} más...
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Total */}
            <div className="px-4 py-2 bg-gray-100 border-b border-gray-300">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Total</span>
                    <span className="text-xl font-bold text-gray-900">
                        {formatCurrency(order.totalPrice)}
                    </span>
                </div>
            </div>


            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 px-4 py-1 bg-gray-900 text-white text-center">
                <span className="text-xs">www.criemos.cl • Gracias por tu compra</span>
            </div>
        </div>
    );
}

export default function ImpresionEtiquetas() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Print options - Fixed to 12 per page logic
    const [paperType, setPaperType] = useState<'carta' | 'oficio' | 'a4'>('carta');
    const [showProducts, setShowProducts] = useState(true);

    // Get order IDs from URL
    const orderIdsParam = searchParams.get('orders');
    const orderIds = useMemo(() => {
        if (!orderIdsParam) return [];
        return orderIdsParam.split(',').map(id => id.trim());
    }, [orderIdsParam]);

    // Fetch orders
    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const response = await getOrders();
                const allData = response.data || [];

                // Filter by IDs if provided
                if (orderIds.length > 0) {
                    const filtered = allData.filter(o =>
                        orderIds.includes(o.id.toString()) ||
                        orderIds.includes(o.orderNumber?.toString() || '') ||
                        orderIds.includes(o.name?.replace('#', '') || '')
                    );
                    setOrders(filtered);
                } else {
                    // Show unfulfilled orders by default
                    const unfulfilled = allData.filter(
                        o => o.fulfillmentStatus === null || o.fulfillmentStatus === 'unfulfilled'
                    );
                    setOrders(unfulfilled.slice(0, 10)); // Limit to 10 for preview
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error al cargar pedidos');
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [orderIds]);

    // Calculate chunks - Always 12 per page
    const labelsPerPage = 12;

    const orderChunks = useMemo(() => {
        const chunks = [];
        for (let i = 0; i < orders.length; i += labelsPerPage) {
            // Pad the chunk with nulls if needed to fill the grid visually? 
            // User said: "simplemete se deja en blanco esa casilla". 
            // So we don't strictly need to pad the array with nulls unless we want to render empty borders.
            // The request "cuadricular la hoja en 12 partes" might imply visible empty boxes, 
            // but "deja en blanco" likely means just empty space. 
            // However, to ensure the grid is exactly 2x6, the CSS grid handles that.
            // We just push the slice.
            chunks.push(orders.slice(i, i + labelsPerPage));
        }
        return chunks;
    }, [orders]);

    // Handle print
    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">Cargando etiquetas...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <Package size={32} className="text-red-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Error</h3>
                <p className="text-gray-500 mb-4">{error}</p>
                <button
                    onClick={() => navigate('/preparar-envio')}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                    Volver
                </button>
            </div>
        );
    }

    return (
        <>
            {/* Print Styles */}
            <style>{`
                @media screen {
                    .sheet-container {
                        background: white;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                        margin-bottom: 2rem;
                        margin-left: auto;
                        margin-right: auto;
                        /* Use defined paper size */
                        width: ${PAPER_SIZES[paperType].width}mm;
                        height: ${PAPER_SIZES[paperType].height}mm;
                        padding: 5mm; /* Visual padding for screen */
                        overflow: hidden;
                    }
                }

                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-area, .print-area * {
                        visibility: visible;
                    }
                    .print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .no-print {
                        display: none !important;
                    }
                    
                    /* Sheet Handling for Print */
                    .sheet-container {
                        width: 100%;
                        height: 100%; /* Fill the page */
                        page-break-after: always;
                        padding: 5mm; /* Physical print margin - MOVED HERE so @page can be 0 */
                        margin: 0;
                        box-shadow: none;
                        border: none;
                        overflow: hidden;
                    }
                    .sheet-container:last-child {
                        page-break-after: auto;
                    }

                    @page {
                        size: ${paperType === 'carta' ? 'letter' : paperType === 'a4' ? 'A4' : 'legal'};
                        margin: 0mm; /* ZERO MARGIN to remove browser headers/footers */
                    }
                
                    .label-container {
                        border: 1px dashed #ccc !important;
                        border-radius: 4px !important;
                    }
                }

                /* Grid Styles - Fixed to 12-up Layout */
                .labels-grid-12 {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    grid-template-rows: repeat(6, 1fr);
                    gap: 2mm;
                    height: 100%;
                    align-content: start;
                }
                
                /* Label Sizing - Fixed Dimensions for 12-up */
                .labels-grid-12 .label-container { 
                    height: 42mm !important; 
                    width: 100% !important; 
                }
            `}</style>

            <div className="space-y-6">
                {/* Header - No Print */}
                <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/preparar-envio')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={20} className="text-gray-600" />
                        </button>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Impresión de Etiquetas</h2>
                            <p className="text-gray-500 mt-1">
                                {orders.length} etiqueta{orders.length !== 1 ? 's' : ''} •
                                {orderChunks.length} página{orderChunks.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrint}
                            disabled={orders.length === 0}
                            className="inline-flex items-center gap-2 px-5 py-2.5 
                                       bg-gradient-to-r from-rose-500 to-purple-500 
                                       text-white rounded-lg font-medium shadow-md 
                                       hover:shadow-lg transition-all duration-200
                                       disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Printer size={18} />
                            Imprimir ({orders.length})
                        </button>
                    </div>
                </div>

                {/* Fixed Settings Panel - Always Visible */}
                <div className="no-print bg-white rounded-xl border border-gray-200 p-4">
                    <h3 className="font-semibold text-gray-800 mb-4">Opciones de Impresión</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Paper Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                Tipo de Papel
                            </label>
                            <select
                                value={paperType}
                                onChange={(e) => setPaperType(e.target.value as 'carta' | 'oficio' | 'a4')}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                            >
                                <option value="carta">Carta (216x279mm)</option>
                                <option value="a4">A4 (210x297mm)</option>
                                <option value="oficio">Oficio (216x330mm)</option>
                            </select>
                            <p className="text-xs text-gray-400 mt-1">
                                12 etiquetas máx. por hoja
                            </p>
                        </div>

                        {/* Checkboxes */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                Contenido
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showProducts}
                                    onChange={(e) => setShowProducts(e.target.checked)}
                                    className="w-4 h-4 text-rose-500 border-gray-300 rounded focus:ring-rose-500"
                                />
                                <span className="text-sm text-gray-700">Lista de productos</span>
                            </label>
                        </div>

                        {/* Info */}
                        <div className="bg-blue-50 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                                <Check size={16} className="text-blue-600 mt-0.5" />
                                <div className="text-xs text-blue-700">
                                    <p className="font-medium mb-1">Tip de impresión</p>
                                    <p>Asegúrate de configurar "Escala" al 100% y "Márgenes" en ninguno.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Labels Preview (Paginated) */}
                {orders.length === 0 ? (
                    <div className="no-print bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <Package size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-800 mb-2">
                            No hay etiquetas para imprimir
                        </h3>
                        <p className="text-gray-500 mb-4">
                            Selecciona pedidos desde Preparación de Envíos
                        </p>
                        <button
                            onClick={() => navigate('/preparar-envio')}
                            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-medium transition-colors"
                        >
                            Ir a Preparación
                        </button>
                    </div>
                ) : (
                    <div className="print-area w-full overflow-x-auto bg-gray-100 p-8 min-h-screen">
                        {orderChunks.map((chunk, pageIndex) => (
                            <div
                                key={pageIndex}
                                className="sheet-container relative"
                            >
                                <div className="labels-grid-12">
                                    {chunk.map((order) => (
                                        <ShippingLabel
                                            key={order.id}
                                            order={order}
                                            showProducts={showProducts}
                                            compact={true} // Always use compact/clean design
                                        />
                                    ))}
                                    {/* Empty slots handled by CSS Grid structure naturally */}
                                </div>
                                {/* Page Number (visual only) */}
                                <div className="no-print absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm text-gray-500">
                                    Página {pageIndex + 1} de {orderChunks.length}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

