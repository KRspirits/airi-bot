import * as store from './store.js';

// 📸 MEDIA BOT. Rekod setiap gambar & video yang bot hantar, supaya boleh dipadam
// untuk semua pada tengah malam (Waktu Malaysia).
let senarai = [];
let dimuat = false;

async function muat() {
    if (dimuat) return;
    dimuat = true;
    try { senarai = JSON.parse((await store.get('media', 'senarai', null)) || '[]'); } catch { senarai = []; }
}
muat();

function simpan() {
    store.set('media', 'senarai', JSON.stringify(senarai.slice(-1000))).catch(() => {});
}

export function catatMedia(jid, key) {
    if (!key?.id) return;
    senarai.push({ jid, key, t: Date.now() });
    simpan();
}

/** Padam semua media yang direkod. Dipanggil pada tengah malam. */
export async function padamSemuaMedia(sock) {
    let bil = 0;
    for (const item of senarai) {
        try { await sock.sendMessage(item.jid, { delete: item.key }); bil++; } catch { /* mungkin dah dipadam */ }
    }
    senarai = [];
    simpan();
    console.log(`[MEDIA] ${bil} media dipadam`);
    return bil;
}
