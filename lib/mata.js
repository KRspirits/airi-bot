import { IDR_PER_RM } from './konteks.js';

// Pemain nombor +62 dikesan sebagai IDR secara automatik. Boleh tukar dengan `.mata rm` atau `.mata idr`.
export function kenalMata(user, jid) {
    if (user.mata === 'RM' || user.mata === 'IDR') return user.mata;
    user.mata = String(jid || '').startsWith('62') ? 'IDR' : 'RM';
    return user.mata;
}

export const rmKeIdr = (rm) => Math.round((Number(rm) || 0) * IDR_PER_RM);
export const idrKeRm = (idr) => Math.round(((Number(idr) || 0) / IDR_PER_RM) * 100) / 100;
export const formatIdr = (idr) => `Rp ${Math.round(idr).toLocaleString('id-ID')}`;
export const formatRm = (rm) => `RM ${Number(rm).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
