import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// =========================================================================
// 🏅 SATU SUMBER UNTUK TIER (nadir). Semua nilai tier ada di sini sahaja.
// Pengali nadir x pengali gred dihadkan (MAX_GABUNGAN) supaya hasil tak melambung tanpa had.
// =========================================================================

export const TIER = {
    Biasa:   { darab: 1.0, label: 'BIASA',  warna: '#94a3b8', kad: false },
    Langka:  { darab: 1.3, label: 'LANGKA', warna: '#38bdf8', kad: false },
    Epik:    { darab: 2.0, label: 'EPIK',   warna: '#c084fc', kad: true  },
    Legenda: { darab: 3.5, label: 'LEGEND', warna: '#fbbf24', kad: true  },
    Mythic:  { darab: 6.0, label: 'MYTHIC', warna: '#f87171', kad: true  },
};

// Had gabungan (nadir x gred). Tanpa had ini, Legenda + Raja boleh jadi 8.75x.
export const MAX_GABUNGAN = 6.0;

export function darabGabungan(nadir, gredDarab) {
    const n = TIER[nadir]?.darab ?? 1;
    return Math.min(MAX_GABUNGAN, n * gredDarab);
}

export const perluKad = (nadir) => !!TIER[nadir]?.kad;

const DIR = path.dirname(fileURLToPath(import.meta.url));
const FOLDER_EPIK = path.join(DIR, '..', 'assets', 'buah_epik');

/** Nama fail kad untuk varieti, contoh "Black Thorn" -> black_thorn. */
export function slugVarieti(nama) {
    return String(nama || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

/** Laluan kad PNG jika wujud, atau null. */
export function kadVarieti(nama) {
    const fail = path.join(FOLDER_EPIK, `${slugVarieti(nama)}.png`);
    return fs.existsSync(fail) ? fail : null;
}

const FOLDER_BUAH = path.join(DIR, '..', 'assets', 'buah');
/** Gambar buah: varieti Epik -> varieti (Biasa/Langka/Legenda) -> gambar tanaman asas. */
export function kadBuah(varieti, crop) {
    const cuba = [
        path.join(FOLDER_EPIK, `${slugVarieti(varieti)}.png`),
        path.join(FOLDER_BUAH, `${slugVarieti(varieti)}.png`),
        path.join(FOLDER_BUAH, `${slugVarieti(crop)}.png`),
    ];
    return cuba.find(f => f && fs.existsSync(f)) || null;
}
