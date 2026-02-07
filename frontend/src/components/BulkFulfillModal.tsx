import { useState, useEffect } from 'react';
import { X, Truck, Package, Copy } from 'lucide-react';
import type { Order, TrackingData } from '../types/shopify';

interface BulkFulfillModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (trackingPayload: Record<number, TrackingData>) => void;
    orders: Order[];
    loading: boolean;
}

export default function BulkFulfillModal({
    isOpen,
    onClose,
    onConfirm,
    orders,
    loading
}: BulkFulfillModalProps) {
    const [trackingPayload, setTrackingPayload] = useState<Record<number, TrackingData>>({});

    // Initialize or reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            const initialPayload: Record<number, TrackingData> = {};
            orders.forEach(order => {
                initialPayload[order.id] = {
                    trackingNumber: '',
                    trackingCompany: '',
                    trackingUrl: ''
                };
            });
            setTrackingPayload(initialPayload);
        }
    }, [isOpen, orders]);

    if (!isOpen) return null;

    const handleInputChange = (orderId: number, field: keyof TrackingData, value: string) => {
        setTrackingPayload(prev => ({
            ...prev,
            [orderId]: {
                ...prev[orderId],
                [field]: value
            }
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(trackingPayload);
    };

    // Helper to duplicate company to all empty fields
    const fillAllCompanies = (company: string) => {
        if (!company) return;
        setTrackingPayload(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(key => {
                const id = Number(key);
                if (!next[id].trackingCompany) {
                    next[id] = { ...next[id], trackingCompany: company };
                }
            });
            return next;
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                            <Truck size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Marcar como Enviados</h3>
                            <p className="text-sm text-gray-500">{orders.length} pedidos seleccionados</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                        disabled={loading}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
                    <div className="p-6 overflow-y-auto min-h-0 flex-1">
                        <div className="bg-amber-50 text-amber-800 text-sm p-3 rounded-lg flex gap-2 items-start mb-6">
                            <Package size={16} className="mt-0.5 shrink-0" />
                            <p>
                                Ingresa la información de seguimiento para cada pedido.
                                <br />
                                <span className="opacity-80 text-xs">Si dejas los campos vacíos, el pedido se marcará como enviado sin seguimiento.</span>
                            </p>
                        </div>

                        <div className="grid grid-cols-[1fr_2fr_2fr] gap-4 mb-2 px-2 font-medium text-xs text-gray-500 uppercase tracking-wider">
                            <div>Pedido / Cliente</div>
                            <div>Empresa de Envío</div>
                            <div>Nº Seguimiento</div>
                        </div>

                        <div className="space-y-3">
                            {orders.map(order => (
                                <div key={order.id} className="grid grid-cols-[1fr_2fr_2fr] gap-4 items-start p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    {/* Order Info */}
                                    <div className="overflow-hidden">
                                        <div className="font-semibold text-gray-900">{order.name}</div>
                                        <div className="text-xs text-gray-500 truncate">
                                            {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Invitado'}
                                        </div>
                                    </div>

                                    {/* Carrier Input */}
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            placeholder="Ej: Starken"
                                            value={trackingPayload[order.id]?.trackingCompany || ''}
                                            onChange={(e) => handleInputChange(order.id, 'trackingCompany', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all"
                                            disabled={loading}
                                        />
                                        {/* Quick fill helper for first item */}
                                        {orders.indexOf(order) === 0 && trackingPayload[order.id]?.trackingCompany && (
                                            <button
                                                type="button"
                                                onClick={() => fillAllCompanies(trackingPayload[order.id].trackingCompany || '')}
                                                className="absolute -right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Copiar a todos los vacíos"
                                            >
                                                <Copy size={14} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Tracking Number Input */}
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="Ej: 123456789"
                                            value={trackingPayload[order.id]?.trackingNumber || ''}
                                            onChange={(e) => handleInputChange(order.id, 'trackingNumber', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-100 p-6 bg-gray-50/50 shrink-0 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Procesando {orders.length}...
                                </>
                            ) : (
                                `Confirmar ${orders.length} Envíos`
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
