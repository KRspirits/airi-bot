import { SAMPAH, IKAN_BIASA, IKAN_RARE, IKAN_MITOS, pancingDB, savePancingDB } from '../plugins/mancing.js';

// Jambatan ke data pancing (satu sumber kebenaran: plugins/mancing.js).
export const CATALOG = { mitos: IKAN_MITOS, rare: IKAN_RARE, biasa: IKAN_BIASA, sampah: SAMPAH };
export { savePancingDB };

export function rarityOf(f) {
    if (f?.rarity) return f.rarity;
    for (const [r, arr] of Object.entries(CATALOG)) if (arr.some(x => x.nama === f?.nama)) return r;
    const h = f?.harga || 0;
    return h >= 3e6 ? 'mitos' : h >= 1e5 ? 'rare' : h >= 200 ? 'biasa' : 'sampah';
}
export function ensureP(jid) {
    if (!pancingDB[jid]) pancingDB[jid] = {
        rod: { nama: 'Tali Rafia', buff_rare: 0 }, reel: { nama: 'Tiada', buff_mitos: 0 },
        umpan: { nama: 'Tiada', qty: 0, bonus_all: 0 }, jala: { nama: 'Tiada', qty: 0, min_tangkapan: 0, max_tangkapan: 0 },
        akuarium: { nama: 'Balang Kuih (Percuma)', slot: 1, ikan: [] }, tong_ikan: []
    };
    const p = pancingDB[jid];
    p.tong_ikan ||= []; p.dex ||= {}; p.akuarium ||= { nama: 'Balang Kuih (Percuma)', slot: 1, ikan: [] };
    return p;
}
export function ownedNames(p) {
    const set = new Set(Object.keys(p.dex || {}));
    for (const f of p.tong_ikan || []) set.add(f.nama);
    for (const f of p.akuarium?.ikan || []) set.add(f.nama);
    return set;
}
