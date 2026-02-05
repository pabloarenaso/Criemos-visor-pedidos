/**
 * Utility for managing locally edited shipping addresses
 * These edits are stored in localStorage and DO NOT sync to Shopify
 */

export interface EditedAddress {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    province: string;
    zip: string;
    phone?: string;
    notes?: string;
}

export interface StoredAddressEdit {
    address: EditedAddress;
    timestamp: string;
    originalAddress: EditedAddress;
}

const STORAGE_PREFIX = 'order_address_';

/**
 * Save an edited address for an order
 */
export function saveEditedAddress(
    orderId: string | number,
    editedAddress: EditedAddress,
    originalAddress: EditedAddress
): void {
    const key = `${STORAGE_PREFIX}${orderId}`;
    const data: StoredAddressEdit = {
        address: editedAddress,
        timestamp: new Date().toISOString(),
        originalAddress,
    };
    localStorage.setItem(key, JSON.stringify(data));
}

/**
 * Get the stored edit for an order (if any)
 */
export function getStoredEdit(orderId: string | number): StoredAddressEdit | null {
    const key = `${STORAGE_PREFIX}${orderId}`;
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    try {
        return JSON.parse(stored) as StoredAddressEdit;
    } catch {
        return null;
    }
}

/**
 * Get the address to use (edited if exists, otherwise original)
 */
export function getAddress(
    orderId: string | number,
    originalAddress: EditedAddress | null
): EditedAddress | null {
    const stored = getStoredEdit(orderId);
    if (stored) {
        return stored.address;
    }
    return originalAddress;
}

/**
 * Check if an order has an edited address
 */
export function hasEditedAddress(orderId: string | number): boolean {
    const key = `${STORAGE_PREFIX}${orderId}`;
    return localStorage.getItem(key) !== null;
}

/**
 * Revert to original address (remove local edit)
 */
export function revertToOriginal(orderId: string | number): void {
    const key = `${STORAGE_PREFIX}${orderId}`;
    localStorage.removeItem(key);
}

/**
 * Get all orders with edited addresses
 */
export function getAllEditedAddresses(): { orderId: string; data: StoredAddressEdit }[] {
    const results: { orderId: string; data: StoredAddressEdit }[] = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
            const orderId = key.replace(STORAGE_PREFIX, '');
            const stored = localStorage.getItem(key);
            if (stored) {
                try {
                    const data = JSON.parse(stored) as StoredAddressEdit;
                    results.push({ orderId, data });
                } catch {
                    // Skip invalid entries
                }
            }
        }
    }

    return results;
}

/**
 * Format an address for display
 */
export function formatAddressForDisplay(address: EditedAddress | null): string {
    if (!address) return 'Sin dirección';

    const parts = [
        `${address.firstName || ''} ${address.lastName || ''}`.trim(),
        address.address1,
        address.address2,
        `${address.city || ''}, ${address.province || ''}`.trim().replace(/^,\s*|,\s*$/g, ''),
        address.zip,
    ].filter(Boolean);

    return parts.join(', ');
}
