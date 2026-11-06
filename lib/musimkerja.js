import * as store from './store.js';
import { isActive } from './activity.js';

// =========================================================================
// 🌦️ MUSIM KERJA. Muncul sendiri ikut masa rawak dalam group aktif (bukan ikut jadual tetap).
// Setiap musim ada tema, tempoh sendiri, dan kerja yang dapat bonus.
// Jarak antara musim: 4 hingga 8 jam. Tempoh: 90 hingga 150 minit.
// =========================================================================

export const TEMA = [
    { id: 'hujan', nama: '🌧️ Hujan Lebat', ket: 'Hujan turun lebat. Kerja luar dapat bonus.', kerja: ['cuci', 'gerai', 'teksi'], mul: 1.5 },
    { id: 'raya', nama: '🌙 Raya Kecil', ket: 'Orang beli makanan berbanyak. Penghantar makanan naik.', kerja: ['kafe', 'runcit'], mul: 1.4 },
    { id: 'jem', nama: '🚗 Jem Teruk', ket: 'Jalan sesak di KL. Pemandu teksi dapat lebih.', kerja: ['teksi'], mul: 1.6 },
    { id: 'pasar', nama: '🛒 Pasar Malam Ramai', ket: 'Gerai pasar malam penuh pelanggan.', kerja: ['gerai', 'runcit'], mul: 1.5 },
    { id: 'sukan', nama: '⚽ Minggu Sukan', ket: 'Ramai pergi tengok bola di kedai kopi.', kerja: ['kafe'], mul: 1.4 },
];

const ANTARA_MIN = 4 * 60, ANTARA_MAX = 8 * 60;   // minit
const TEMPOH_MIN = 90, TEMPOH_MAX = 150;          // minit
const rnd = (a, b) => a + Math.random() * (b - a);

let cache = null;

async function muat() {
    if (!cache) cache = await store.get('musim', 'state', { aktif: null, seterusnya: 0 });
    return cache;
}

async function simpan() {
    await store.set('musim', 'state', cache);
}

/** Musim yang sedang berjalan, atau null. Sync: guna cache selepas muat(). */
export function musimSemasa(ts = Date.now()) {
    if (!cache?.aktif) return null;
    if (cache.aktif.tamat <= ts) return null;
    return cache.aktif;
}

/** Pengganda untuk satu kerja semasa musim. */
export function mulUntuk(kerjaId, ts = Date.now()) {
    const m = musimSemasa(ts);
    if (!m) return 1;
    return m.kerja.includes(kerjaId) ? m.mul : 1;
}

/** Dipanggil oleh scheduler. Umum tamat atau mula musim baharu ikut masa rawak. */
export async function musimTick(sock, groups) {
    await muat();
    const kini = Date.now();
    if (cache.aktif && cache.aktif.tamat <= kini) {
        const tamat = cache.aktif;
        cache.aktif = null;
        cache.seterusnya = kini + rnd(ANTARA_MIN, ANTARA_MAX) * 60e3;
        await simpan();
        for (const g of groups.filter(g => isActive(g, 2)))
            await sock.sendMessage(g, { text: `🏁 *${tamat.nama}* dah tamat. Terima kasih semua!` }).catch(() => {});
        return;
    }
    if (cache.aktif) return;
    if (!cache.seterusnya) { cache.seterusnya = kini + rnd(ANTARA_MIN, ANTARA_MAX) * 60e3; await simpan(); return; }
    if (kini < cache.seterusnya) return;

    const tema = TEMA[Math.floor(Math.random() * TEMA.length)];
    const tempoh = Math.round(rnd(TEMPOH_MIN, TEMPOH_MAX));
    cache.aktif = { ...tema, mula: kini, tamat: kini + tempoh * 60e3 };
    await simpan();
    const teks = `${tema.nama}\n${tema.ket}\nKerja bonus: ${tema.kerja.join(', ')} (x${tema.mul})\nBerlangsung ${tempoh} minit.`;
    for (const g of groups.filter(g => isActive(g, 2))) await sock.sendMessage(g, { text: teks }).catch(() => {});
}
