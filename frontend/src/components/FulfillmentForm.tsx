import { useState } from 'react';
import { Truck, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { fulfillOrder } from '../services/api';
import type { TrackingData } from '../types/shopify';

// Chilean shipping companies
const SHIPPING_COMPANIES = [
    { value: '', label: 'Seleccionar empresa...' },
    { value: 'correos-chile', label: 'Correos Chile' },
    { value: 'chilexpress', label: 'Chilexpress' },
    { value: 'starken', label: 'Starken' },
    { value: 'bluexpress', label: 'BluExpress' },
    { value: 'dhl', label: 'DHL' },
    { value: 'fedex', label: 'FedEx' },
    { value: 'otro', label: 'Otro' },
];

interface FulfillmentFormProps {
    orderId: string;
    onSuccess?: () => void;
}

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

export default function FulfillmentForm({ orderId, onSuccess }: FulfillmentFormProps) {
    const [trackingNumber, setTrackingNumber] = useState('');
    const [trackingUrl, setTrackingUrl] = useState('');
    const [trackingCompany, setTrackingCompany] = useState('');
    const [notifyCustomer, setNotifyCustomer] = useState(true);
    const [status, setStatus] = useState<FormStatus>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!trackingNumber.trim()) {
            setErrorMessage('El número de seguimiento es requerido');
            setStatus('error');
            return;
        }

        setStatus('loading');
        setErrorMessage('');

        try {
            const trackingData: TrackingData = {
                trackingNumber: trackingNumber.trim(),
                trackingUrl: trackingUrl.trim() || undefined,
                trackingCompany: trackingCompany || undefined,
                notifyCustomer,
            };

            await fulfillOrder(orderId, trackingData);
            setStatus('success');

            // Call onSuccess callback after a short delay
            if (onSuccess) {
                setTimeout(onSuccess, 1500);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error al marcar como enviado';
            setErrorMessage(message);
            setStatus('error');
        }
    };

    // Success state
    if (status === 'success') {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle size={32} className="text-emerald-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                    ¡Pedido marcado como enviado!
                </h3>
                <p className="text-gray-500">
                    El cliente ha sido notificado del envío.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error message */}
            {status === 'error' && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-lg">
                    <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
            )}

            {/* Tracking Number */}
            <div>
                <label htmlFor="trackingNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Número de seguimiento *
                </label>
                <input
                    type="text"
                    id="trackingNumber"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Ej: 123456789"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg 
                     focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 
                     transition-colors outline-none"
                    disabled={status === 'loading'}
                />
            </div>

            {/* Shipping Company */}
            <div>
                <label htmlFor="trackingCompany" className="block text-sm font-medium text-gray-700 mb-1">
                    Empresa de envío
                </label>
                <select
                    id="trackingCompany"
                    value={trackingCompany}
                    onChange={(e) => setTrackingCompany(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg 
                     focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 
                     transition-colors outline-none bg-white"
                    disabled={status === 'loading'}
                >
                    {SHIPPING_COMPANIES.map((company) => (
                        <option key={company.value} value={company.value}>
                            {company.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Tracking URL */}
            <div>
                <label htmlFor="trackingUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    URL de seguimiento (opcional)
                </label>
                <input
                    type="url"
                    id="trackingUrl"
                    value={trackingUrl}
                    onChange={(e) => setTrackingUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg 
                     focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 
                     transition-colors outline-none"
                    disabled={status === 'loading'}
                />
            </div>

            {/* Notify Customer */}
            <div className="flex items-center gap-3">
                <input
                    type="checkbox"
                    id="notifyCustomer"
                    checked={notifyCustomer}
                    onChange={(e) => setNotifyCustomer(e.target.checked)}
                    className="w-4 h-4 text-rose-500 border-gray-300 rounded 
                     focus:ring-rose-500 cursor-pointer"
                    disabled={status === 'loading'}
                />
                <label htmlFor="notifyCustomer" className="text-sm text-gray-700 cursor-pointer">
                    Notificar al cliente por email
                </label>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 
                   bg-gradient-to-r from-rose-500 to-purple-500 
                   text-white font-medium rounded-lg shadow-md 
                   hover:shadow-lg transition-all duration-200
                   disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {status === 'loading' ? (
                    <>
                        <Loader2 size={20} className="animate-spin" />
                        Procesando...
                    </>
                ) : (
                    <>
                        <Truck size={20} />
                        Marcar como Enviado
                    </>
                )}
            </button>
        </form>
    );
}
