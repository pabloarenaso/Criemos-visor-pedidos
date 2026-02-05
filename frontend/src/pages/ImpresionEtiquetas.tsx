import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import {
    Printer,
    ArrowLeft,
    Settings2,
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

// Print format options
type PrintFormat = 'individual' | '2-per-page' | '4-per-page';

// Paper sizes in mm
const PAPER_SIZES = {
    carta: { width: 216, height: 279, name: 'Carta' },
    oficio: { width: 216, height: 330, name: 'Oficio' },
};

// Label size: 10x15cm = 100x150mm
const LABEL_SIZE = { width: 100, height: 150 };

// Calculate max labels per page
function getLabelsPerPage(paperType: 'carta' | 'oficio'): number {
    const paper = PAPER_SIZES[paperType];
    const cols = Math.floor(paper.width / LABEL_SIZE.width);
    const rows = Math.floor(paper.height / LABEL_SIZE.height);
    return cols * rows;
}

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
    return toEditedAddress(order.shippingAddress);
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
interface LabelProps {
    order: Order;
    showQR: boolean;
    showProducts: boolean;
    showBarcode: boolean;
}

function ShippingLabel({ order, showQR, showProducts, showBarcode }: LabelProps) {
    const address = getDisplayAddress(order);
    const isEdited = hasEditedAddress(order.id);
    const itemCount = order.lineItems?.length || 0;

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
                    <div className="font-bold text-lg">{order.name}</div>
                    <div className="text-xs text-gray-300">
                        {new Date(order.createdAt).toLocaleDateString('es-CL')}
                    </div>
                </div>
            </div>

            {/* Recipient Section */}
            <div className="px-4 py-3 border-b border-gray-300">
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
                    <div className="space-y-1">
                        <p className="font-bold text-lg text-gray-900">
                            {address.firstName} {address.lastName}
                        </p>
                        <p className="text-sm text-gray-700">{address.address1}</p>
                        {address.address2 && (
                            <p className="text-sm text-gray-700">{address.address2}</p>
                        )}
                        <p className="text-sm text-gray-700">
                            {address.city}, {address.province}
                        </p>
                        {address.zip && (
                            <p className="text-sm text-gray-600">CP: {address.zip}</p>
                        )}
                        {address.phone && (
                            <p className="text-sm text-gray-600">Tel: {address.phone}</p>
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

            {/* Codes Section */}
            {(showQR || showBarcode) && (
                <div className="px-4 py-3 flex items-center justify-center gap-4">
                    {showQR && (
                        <div className="flex flex-col items-center">
                            <QRCodeSVG
                                value={`https://criemos.cl/order/${order.id}`}
                                size={60}
                                level="M"
                            />
                            <span className="text-xs text-gray-400 mt-1">Seguimiento</span>
                        </div>
                    )}
                    {showBarcode && (
                        <div className="flex flex-col items-center">
                            <Barcode
                                value={order.orderNumber?.toString() || order.id.toString()}
                                width={1.2}
                                height={40}
                                fontSize={10}
                                margin={0}
                                displayValue={true}
                            />
                        </div>
                    )}
                </div>
            )}

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

    // Print options
    const [printFormat, setPrintFormat] = useState<PrintFormat>('individual');
    const [paperType, setPaperType] = useState<'carta' | 'oficio'>('carta');
    const [showQR, setShowQR] = useState(true);
    const [showProducts, setShowProducts] = useState(true);
    const [showBarcode, setShowBarcode] = useState(true);
    const [showSettings, setShowSettings] = useState(false);

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

    // Calculate max labels info
    const maxLabels = getLabelsPerPage(paperType);
    const totalPages = Math.ceil(orders.length / (printFormat === 'individual' ? 1 : printFormat === '2-per-page' ? 2 : 4));

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
                    .label-container {
                        page-break-after: always;
                        page-break-inside: avoid;
                        margin: 0 auto;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                    }
                    .label-container:last-child {
                        page-break-after: auto;
                    }
                    @page {
                        size: ${printFormat === 'individual' ? '100mm 150mm' : paperType === 'carta' ? 'letter' : 'legal'};
                        margin: ${printFormat === 'individual' ? '0' : '10mm'};
                    }
                    .labels-grid-2 {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 5mm;
                    }
                    .labels-grid-4 {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        grid-template-rows: repeat(2, 1fr);
                        gap: 5mm;
                    }
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
                                {totalPages} página{totalPages !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className={`p-2.5 rounded-lg transition-colors ${showSettings ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-600'
                                }`}
                        >
                            <Settings2 size={20} />
                        </button>
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

                {/* Settings Panel - No Print */}
                {showSettings && (
                    <div className="no-print bg-white rounded-xl border border-gray-200 p-4">
                        <h3 className="font-semibold text-gray-800 mb-4">Opciones de Impresión</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Format */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                    Formato
                                </label>
                                <select
                                    value={printFormat}
                                    onChange={(e) => setPrintFormat(e.target.value as PrintFormat)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                                >
                                    <option value="individual">Individual (10x15cm)</option>
                                    <option value="2-per-page">2 por página</option>
                                    <option value="4-per-page">4 por página</option>
                                </select>
                            </div>

                            {/* Paper Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                    Tipo de Papel
                                </label>
                                <select
                                    value={paperType}
                                    onChange={(e) => setPaperType(e.target.value as 'carta' | 'oficio')}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                                >
                                    <option value="carta">Carta (216x279mm)</option>
                                    <option value="oficio">Oficio (216x330mm)</option>
                                </select>
                                <p className="text-xs text-gray-400 mt-1">
                                    Máx. {maxLabels} etiquetas por hoja
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
                                        checked={showQR}
                                        onChange={(e) => setShowQR(e.target.checked)}
                                        className="w-4 h-4 text-rose-500 border-gray-300 rounded focus:ring-rose-500"
                                    />
                                    <span className="text-sm text-gray-700">Código QR</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showBarcode}
                                        onChange={(e) => setShowBarcode(e.target.checked)}
                                        className="w-4 h-4 text-rose-500 border-gray-300 rounded focus:ring-rose-500"
                                    />
                                    <span className="text-sm text-gray-700">Código de barras</span>
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
                                        <p>Usa papel adhesivo de 10x15cm para mejores resultados.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Labels Preview */}
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
                    <div className={`print-area ${printFormat === '2-per-page' ? 'labels-grid-2' :
                        printFormat === '4-per-page' ? 'labels-grid-4' : ''
                        }`}>
                        <div className={`
                            grid gap-6 
                            ${printFormat === 'individual' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : ''}
                            ${printFormat === '2-per-page' ? 'grid-cols-2' : ''}
                            ${printFormat === '4-per-page' ? 'grid-cols-2' : ''}
                        `}>
                            {orders.map((order) => (
                                <div key={order.id} className="flex justify-center">
                                    <ShippingLabel
                                        order={order}
                                        showQR={showQR}
                                        showProducts={showProducts}
                                        showBarcode={showBarcode}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
