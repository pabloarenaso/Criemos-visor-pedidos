/**
 * Utility functions for shipping calculations
 */

/**
 * Adds business days (Monday to Friday) to a given date.
 * @param date The starting date
 * @param days Number of business days to add
 * @returns A new Date object
 */
export function addBusinessDays(date: Date, days: number): Date {
    const result = new Date(date);
    let count = 0;
    while (count < days) {
        result.setDate(result.getDate() + 1);
        const day = result.getDay();
        // 0 = Sunday, 6 = Saturday
        if (day !== 0 && day !== 6) {
            count++;
        }
    }
    return result;
}

/**
 * Calculates the shipping date based on order line items.
 * Rule: 
 * - If any item has "PEDIDO" in its title: 20 business days.
 * - Otherwise: 3 business days (72 business hours benchmark).
 * @param createdAt ISO date string of order creation
 * @param lineItems Array of line items with titles
 * @returns Date object for shipping
 */
export function calculateShippingDate(createdAt: string, lineItems: any[]): Date {
    const orderDate = new Date(createdAt);
    const hasOrderSpecificItem = lineItems.some(item =>
        (item.title || item.name || '').toUpperCase().includes('PEDIDO')
    );

    const businessDaysToAdd = hasOrderSpecificItem ? 20 : 3;
    return addBusinessDays(orderDate, businessDaysToAdd);
}

/**
 * Formats a date to DD/MM/YYYY for display
 */
export function formatDisplayDate(date: Date): string {
    return date.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}
