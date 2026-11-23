import { createCanvas } from '@napi-rs/canvas';
import { lukisIkan } from './gambarikan.js';

// =========================================================================
// 🕸️ KAD HASIL JALA. Banyak ikan dalam satu tebaran dipaparkan sebagai grid.
// 12 ikan setiap halaman (4 lajur x 3 baris). Halaman lebih dari satu kalau ikan banyak.
// =========================================================================

const W = 1080, PER = 12, COLS = 4, ROWS = 3, CELL_W = 250, CELL_H = 270, HEAD = 120;
const RARITY_WARNA = { biasa: '#c0c7d1', rare: '#38bdf8', epic: '#a855f7', legend: '#facc15', mitos: '#ef4444', secret: '#f5f5f5', fossil: '#d6b97a', sampah: '#a16207' };
const rp = n => `RM ${Math.round(Number(n) || 0).toLocaleString('en-US')}`;

/** Pulang array PNG (satu per halaman). koleksi: [{ nama, harga, rarity }]. */
export function renderJalaPages(koleksi) {
    const bil = Math.max(1, Math.ceil(koleksi.length / PER));
    const pages = [];
    for (let p = 0; p < bil; p++) {
        const potongan = koleksi.slice(p * PER, (p + 1) * PER);
        const H = HEAD + ROWS * CELL_H + 40;
        const c = createCanvas(W, H), ctx = c.getContext('2d');
        const latar = ctx.createLinearGradient(0, 0, 0, H);
        latar.addColorStop(0, '#0b2a4a'); latar.addColorStop(1, '#06182e');
        ctx.fillStyle = latar; ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 44px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('🕸️ TEBARAN JALA', 40, 62);
        ctx.fillStyle = '#7dd3fc'; ctx.font = '26px sans-serif';
        ctx.fillText(`${koleksi.length} ekor · halaman ${p + 1}/${bil}`, 40, 100);

        potongan.forEach((ikan, i) => {
            const col = i % COLS, row = Math.floor(i / COLS);
            const x = 20 + col * CELL_W, y = HEAD + row * CELL_H;
            const warna = RARITY_WARNA[ikan.rarity] || '#94a3b8';
            ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x + 6, y + 6, CELL_W - 12, CELL_H - 12);
            ctx.fillStyle = warna; ctx.fillRect(x + 6, y + 6, CELL_W - 12, 6);
            const pusat = { x: x + CELL_W / 2, y: y + 130 };
            if (!lukisIkan(ctx, ikan.rarity, ikan.nama, pusat.x, pusat.y, 190)) {
                ctx.fillStyle = warna; ctx.font = 'bold 60px sans-serif'; ctx.textAlign = 'center';
                ctx.fillText('🐟', pusat.x, pusat.y + 20);
            }
            ctx.fillStyle = '#ffffff'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(String(ikan.nama).replace(/[^\x00-\x7F\u00C0-\u024F ]+/g, '').trim().slice(0, 20), x + CELL_W / 2, y + 240);
            ctx.fillStyle = '#fde68a'; ctx.font = 'bold 20px sans-serif';
            ctx.fillText(rp(ikan.harga), x + CELL_W / 2, y + 262);
        });
        ctx.textAlign = 'left';
        pages.push(c.toBuffer('image/png'));
    }
    return pages;
}
