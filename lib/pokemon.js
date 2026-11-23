import { createCanvas, loadImage } from '@napi-rs/canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// =========================================================================
// 🃏 KAD POKÉMON. 200 kad (50 setiap tier), 4 pek dengan kebarangkalian tier berbeza.
// Pemain beli pek, buka SATU kad, lihat nilai, dan pilih simpan atau jual.
// Harga jual = 80% nilai pasaran. Harga pek boleh diubah dalam PEK di bawah.
// =========================================================================

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ASET = path.join(DIR, '..', 'assets', 'pokemon');
const KAD = JSON.parse(fs.readFileSync(path.join(DIR, 'pokemon-kad-data.json'), 'utf8'));
const TIER_NAMA = { B: 'Biasa', R: 'Rare', E: 'Epik', M: 'Mitos' };

export const PEK = {
    1: { nama: 'Pek Charizard', harga: 4710000, odds: { B: 85, R: 14, E: 1, M: 0 } },
    2: { nama: 'Pek Pikachu', harga: 10440000, odds: { B: 65, R: 28, E: 6, M: 1 } },
    3: { nama: 'Pek Mewtwo', harga: 33390000, odds: { B: 20, R: 40, E: 35, M: 5 } },
    4: { nama: 'Pek Lugia', harga: 68000000, odds: { B: 5, R: 20, E: 60, M: 15 } },
};
export const JUAL_PERATUS = 0.8;

const cache = new Map();
async function imej(f) {
    if (cache.has(f)) return cache.get(f);
    const img = fs.existsSync(f) ? await loadImage(fs.readFileSync(f)).catch(() => null) : null;
    cache.set(f, img);
    return img;
}

/**
 * Buka satu pek. Ada JAMINAN (pity): kalau dah banyak pek tanpa kad tinggi, kad tinggi dijamin.
 * pity = { [nomorPek]: { tanpaE: n, tanpaM: n, tanpaR: n } } — dikemas kini & dipulangkan.
 * Pek 1-2: Rare dijamin lepas 10 pek. Pek 3: Epik dijamin lepas 5 pek, Mythic lepas 25 pek.
 * Pek 4: Epik dijamin lepas 3 pek, Mythic lepas 12 pek.
 */
const JAMIN = {
    1: { r: 10 }, 2: { r: 10, e: 20 },
    3: { e: 5, m: 25 }, 4: { e: 3, m: 12 },
};
export function bukaPek(nomor, pity = {}) {
    const pek = PEK[nomor];
    if (!pek) return null;
    const p = { tanpaR: 0, tanpaE: 0, tanpaM: 0, ...(pity[nomor] || {}) };
    const j = JAMIN[nomor] || {};
    const jumlah = Object.values(pek.odds).reduce((x, y) => x + y, 0);
    let r = Math.random() * jumlah, tier = 'B';
    for (const t of ['B', 'R', 'E', 'M']) { r -= pek.odds[t]; if (r < 0) { tier = t; break; } }
    // jaminan: paksa tier tinggi bila dah cukup pek tanpa tier tu
    if (j.m && p.tanpaM + 1 >= j.m) tier = 'M';
    else if (j.e && p.tanpaE + 1 >= j.e && tier === 'B' || j.e && p.tanpaE + 1 >= j.e && tier === 'R') tier = 'E';
    else if (j.r && p.tanpaR + 1 >= j.r && tier === 'B') tier = 'R';
    const pool = KAD.filter(k => k.kod[1] === tier);
    const kad = pool[Math.floor(Math.random() * pool.length)];
    // kemas kini kaunter jaminan
    p.tanpaR = (tier === 'B') ? p.tanpaR + 1 : 0;
    p.tanpaE = (tier === 'B' || tier === 'R') ? p.tanpaE + 1 : 0;
    p.tanpaM = (tier === 'M') ? 0 : p.tanpaM + 1;
    const pityBaru = { ...pity, [nomor]: p };
    return { ...kad, tier: TIER_NAMA[tier], pity: pityBaru };
}

export function hargaJual(kad) {
    return Math.round(kad.harga * JUAL_PERATUS);
}

export function cariKad(kod) {
    return KAD.find(k => k.kod === String(kod).toUpperCase());
}

/** Lukis kad penuh (bingkai ikut tier + gambar Pokémon + nama + nilai). */
export async function renderKad(kad) {
    const tierKod = kad.kod[1];
    const folder = { B: 'biasa', R: 'rare', E: 'epik', M: 'mitos' }[tierKod];
    const bingkai = await imej(path.join(ASET, `bingkai_${folder}.png`));
    const art = await imej(path.join(ASET, 'cards', `${kad.kod}.png`));
    const W = 480, H = 672;
    const c = createCanvas(W, H), ctx = c.getContext('2d');
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, W, H);
    // tetingkap dalam bingkai: 19% kiri/kanan, 11% atas, 12% bawah
    const tl = Math.round(W * 0.19), tw = Math.round(W * 0.62), tt = Math.round(H * 0.11), th = Math.round(H * 0.77);
    if (art) {
        const sc = Math.max(tw / art.width, th / art.height);
        ctx.drawImage(art, tl + (tw - art.width * sc) / 2, tt + (th - art.height * sc) / 2, art.width * sc, art.height * sc);
    }
    if (bingkai) ctx.drawImage(bingkai, 0, 0, W, H);
    // plak nama, kod, dan nilai di bahagian bawah tetingkap
    ctx.fillStyle = 'rgba(6,24,46,0.8)'; ctx.fillRect(tl, tt + th - 58, tw, 58);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 22px sans-serif';
    ctx.fillText(kad.nama.slice(0, 22), W / 2, tt + th - 30);
    ctx.fillStyle = '#fde68a'; ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`${kad.kod} · RM ${kad.harga.toLocaleString('en-US')}`, W / 2, tt + th - 8);
    return c.toBuffer('image/png');
}

/** Gambar kedai pek (untuk .beli_pokemon). */
export async function gambarKedai() {
    return fs.readFileSync(path.join(ASET, 'kedai.jpg'));
}
