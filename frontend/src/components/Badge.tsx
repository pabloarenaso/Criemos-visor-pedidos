import type { ReactNode } from 'react';

type BadgeVariant =
    | 'success'
    | 'warning'
    | 'error'
    | 'info'
    | 'neutral'
    | 'paid'
    | 'pending'
    | 'refunded'
    | 'fulfilled'
    | 'unfulfilled'
    | 'partial';

interface BadgeProps {
    children: ReactNode;
    variant?: BadgeVariant;
    size?: 'sm' | 'md';
    className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
    // Generic variants
    success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    error: 'bg-red-100 text-red-700 border-red-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
    neutral: 'bg-gray-100 text-gray-600 border-gray-200',

    // Status-specific variants
    paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    refunded: 'bg-red-100 text-red-700 border-red-200',
    fulfilled: 'bg-blue-100 text-blue-700 border-blue-200',
    unfulfilled: 'bg-gray-100 text-gray-600 border-gray-200',
    partial: 'bg-purple-100 text-purple-700 border-purple-200',
};

const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
};

export default function Badge({
    children,
    variant = 'neutral',
    size = 'sm',
    className = ''
}: BadgeProps) {
    return (
        <span
            className={`
        inline-flex items-center font-medium rounded-full border
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
        >
            {children}
        </span>
    );
}

// Helper function to get variant from financial status
export function getFinancialStatusVariant(status: string): BadgeVariant {
    const statusMap: Record<string, BadgeVariant> = {
        paid: 'paid',
        pending: 'pending',
        authorized: 'warning',
        partially_paid: 'warning',
        partially_refunded: 'warning',
        refunded: 'refunded',
        voided: 'error',
    };
    return statusMap[status] || 'neutral';
}

// Helper function to get variant from fulfillment status
export function getFulfillmentStatusVariant(status: string | null): BadgeVariant {
    if (!status) return 'unfulfilled';
    const statusMap: Record<string, BadgeVariant> = {
        fulfilled: 'fulfilled',
        partial: 'partial',
        unfulfilled: 'unfulfilled',
    };
    return statusMap[status] || 'neutral';
}

// Helper to translate status to Spanish
export function translateFinancialStatus(status: string): string {
    const translations: Record<string, string> = {
        paid: 'Pagado',
        pending: 'Pendiente',
        authorized: 'Autorizado',
        partially_paid: 'Pago parcial',
        partially_refunded: 'Reembolso parcial',
        refunded: 'Reembolsado',
        voided: 'Anulado',
    };
    return translations[status] || status;
}

export function translateFulfillmentStatus(status: string | null): string {
    if (!status) return 'Sin enviar';
    const translations: Record<string, string> = {
        fulfilled: 'Enviado',
        partial: 'Parcial',
        unfulfilled: 'Sin enviar',
    };
    return translations[status] || status;
}
