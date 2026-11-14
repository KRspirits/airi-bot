import { AsyncLocalStorage } from 'async_hooks';

// =========================================================================
// 🌐 KONTEKS PEMAIN. Setiap command berjalan dalam konteks pemain sendiri (mata wang),
// tanpa variable global. Selamat bila banyak pemain guna bot serentak.
// Wallet semua pemain kekal dalam RM. Rupiah hanya untuk paparan.
// =========================================================================

export const IDR_PER_RM = 3400;   // kadar tetap untuk paparan (boleh laras)
export const konteks = new AsyncLocalStorage();
export const mataSemasa = () => konteks.getStore()?.mata || 'RM';

// Paparan dua mata: RM dalam kurungan tepi Rupiah (atau sebaliknya), untuk papan & kad umum.
export const dua = (rm) => {
    const r = Math.round(Number(rm) || 0);
    return `Rp ${Math.round(r * IDR_PER_RM).toLocaleString('id-ID')} (RM ${r.toLocaleString('en-US')})`;
};
// Paparan ikut mata pemain: IDR -> "Rp x (RM y)", RM -> "RM y (Rp z)".
export const papar = (mata, rm) => {
    const r = Math.round(Number(rm) || 0);
    return mata === 'IDR'
        ? `Rp ${Math.round(r * IDR_PER_RM).toLocaleString('id-ID')} (RM ${r.toLocaleString('en-US')})`
        : `RM ${r.toLocaleString('en-US')} (Rp ${Math.round(r * IDR_PER_RM).toLocaleString('id-ID')})`;
};
