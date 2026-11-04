// =========================================================================
// 📈 AKTIVITI GROUP. Kira pengirim unik dalam tetingkap masa.
// Dipakai untuk kurangkan bunyi bot bila group senyap (chatter rawak, acara rawak, mitos).
// =========================================================================

const TETINGKAP_MS = 30 * 60 * 1000;
const rekod = new Map(); // chatId -> Map(senderId -> masa terakhir)

export function recordActivity(chatId, sender) {
    if (!chatId || !sender) return;
    const peta = rekod.get(chatId) || new Map();
    peta.set(sender, Date.now());
    const potong = Date.now() - TETINGKAP_MS;
    for (const [k, v] of peta) if (v < potong) peta.delete(k);
    rekod.set(chatId, peta);
}

/** Benar jika sekurang-kurangnya `min` pengirim unik dalam 30 minit terakhir. */
export function isActive(chatId, min = 3) {
    const peta = rekod.get(chatId);
    if (!peta) return false;
    const potong = Date.now() - TETINGKAP_MS;
    let n = 0;
    for (const v of peta.values()) if (v >= potong) n++;
    return n >= min;
}
