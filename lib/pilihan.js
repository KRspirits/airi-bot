// =========================================================================
// 🔢 PILIHAN NOMBOR. Pemain balas dengan nombor untuk pilih tindakan (contoh: balas 2).
// Pilihan sah 5 minit. Hanya nombor 1 hingga 2 digit, dan hanya bila pilihan sedang aktif.
// =========================================================================

const aktif = new Map(); // sender -> { senarai, tamat }

export function bukaPilihan(sender, senarai) {
    aktif.set(sender, { senarai, tamat: Date.now() + 5 * 60e3 });
}

/** Tukar nombor kepada arahan. Pulang null kalau bukan pilihan sah. */
export function resolvePilihan(sender, teks) {
    const st = aktif.get(sender);
    if (!st) return null;
    if (Date.now() > st.tamat) { aktif.delete(sender); return null; }
    const t = String(teks || '').trim();
    if (!/^\d{1,2}$/.test(t)) return null;
    const item = st.senarai[Number(t) - 1];
    if (!item) return null;
    aktif.delete(sender);
    return item.arahan;
}
