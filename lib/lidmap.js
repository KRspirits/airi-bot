import * as store from './store.js';

// =========================================================================
// 🪪 PENYELARASAN ID. WhatsApp kadang hantar ID baharu (LID, contoh 1234@lid)
// bukan nombor telefon (contoh 6012xxx@s.whatsapp.net). Modul ni simpan pasangan
// LID -> nombor telefon bila mesej diterima, dan tukar balik bila ada sasaran (tag).
// =========================================================================

const PETA = new Map();   // lid -> pn
let dimuat = false;

async function muat() {
    if (dimuat) return;
    dimuat = true;
    try {
        const raw = await store.get('lid', 'peta', null);
        if (raw) for (const [k, v] of Object.entries(JSON.parse(raw))) PETA.set(k, v);
    } catch (e) { console.error('[LID] gagal muat peta:', e.message); }
}
muat();

function simpanPeta() {
    store.set('lid', 'peta', JSON.stringify(Object.fromEntries(PETA))).catch(() => {});
}

/**
 * Cari nombor telefon untuk LID. Cuba cache dulu, kemudian pemetaan dalaman Baileys.
 * Guna ini sebelum cipta/ambil akaun dan gambar profil.
 */
export async function resolveAsync(jid, sock) {
    if (!jid || !String(jid).endsWith('@lid')) return jid;
    if (PETA.has(jid)) return PETA.get(jid);
    try {
        const pn = await sock?.signalRepository?.lidMapping?.getPNForLID?.(jid);
        if (pn && String(pn).endsWith('@s.whatsapp.net')) {
            PETA.set(jid, pn);
            simpanPeta();
            return pn;
        }
    } catch (e) { console.error('[LID] pemetaan gagal:', e.message); }
    return jid;
}

/** Rekod pasangan bila mesej ada kedua-dua ID. */
export function catatLid(m) {
    const lid = m?.key?.participant?.endsWith?.('@lid') ? m.key.participant : null;
    const pn = m?.key?.participantAlt || m?.key?.remoteJidAlt;
    if (!lid || !pn || !String(pn).endsWith('@s.whatsapp.net') || PETA.get(lid) === pn) return;
    PETA.set(lid, pn);
    simpanPeta();
}

/** Tukar ID LID kepada nombor telefon kalau diketahui. Lain-lain dipulangkan terus. */
export function resolveJid(jid) {
    if (!jid) return jid;
    if (String(jid).endsWith('@lid')) return PETA.get(jid) || jid;
    return jid;
}
