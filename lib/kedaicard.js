import { createCanvas, loadImage } from '@napi-rs/canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { KEDAI, KEDAI_LV } from './kedaidata.js';

// =========================================================================
// 🏪 KAD KEDAI PANCING. Satu gambar: latar kedai, lima bahagian (joran, reel,
// umpan, jala, akuarium), setiap barang ada gambar, harga dan level.
// Kalau gambar tak ada, kad guna simbol supaya tetap boleh dipaparkan.
// =========================================================================

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ASET = path.join(DIR, '..', 'assets', 'kedai');
const BAHAGIAN = [
    { kat: 'rod', tajuk: 'JORAN', arahan: 'beli_rod', ikon: 'ikon_rod', warna: '#38e8ff', simbol: '🎣' },
    { kat: 'reel', tajuk: 'REEL', arahan: 'beli_reel', ikon: 'ikon_reel', warna: '#fbbf24', simbol: '⚙️' },
    { kat: 'umpan', tajuk: 'UMPAN', arahan: 'beli_umpan', ikon: 'ikon_umpan', warna: '#86efac', simbol: '🪱' },
    { kat: 'jala', tajuk: 'JALA', arahan: 'beli_jala', ikon: 'ikon_jala', warna: '#c4b5fd', simbol: '🕸️' },
    { kat: 'akuarium', tajuk: 'AKUARIUM', arahan: 'beli_akuarium', ikon: 'ikon_akuarium', warna: '#67e8f9', simbol: '🐠' },
];
const W = 1200, HEAD = 150, SEC_H = 56, CARD_H = 300, GAP = 20;
const CARD_W = 224, CARD_GAP = 12;
const cache = new Map();

async function gambar(nama) {
    if (cache.has(nama)) return cache.get(nama);
    const f = path.join(ASET, `${nama}.png`);
    const img = fs.existsSync(f) ? await loadImage(fs.readFileSync(f)).catch(() => null) : null;
    cache.set(nama, img);
    return img;
}

const rp = n => `RM ${Math.round(Number(n) || 0).toLocaleString('en-US')}`;

export async function renderKedai() {
    const latar = await gambar('kedai_latar');
    const H = HEAD + BAHAGIAN.length * (SEC_H + CARD_H + GAP) + 40;
    const c = createCanvas(W, H), ctx = c.getContext('2d');

    // latar: gambar kedai, digelapkan supaya teks jelas
    ctx.fillStyle = '#06182e'; ctx.fillRect(0, 0, W, H);
    if (latar) {
        const s = Math.max(W / latar.width, H / latar.height);
        ctx.globalAlpha = 0.35;
        ctx.drawImage(latar, (W - latar.width * s) / 2, (H - latar.height * s) / 2, latar.width * s, latar.height * s);
        ctx.globalAlpha = 1;
    }
    ctx.fillStyle = 'rgba(6,24,46,0.72)'; ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 56px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('KEDAI PANCING', 40, 74);
    ctx.fillStyle = '#7dd3fc'; ctx.font = '26px sans-serif';
    ctx.fillText('Pilih barang, harga dan level dipaparkan di bawah', 40, 116);

    let y = HEAD;
    for (const b of BAHAGIAN) {
        const senarai = Object.entries(KEDAI[b.kat] || {});
        // bar bahagian
        ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(24, y, W - 48, SEC_H);
        ctx.fillStyle = b.warna; ctx.fillRect(24, y, 8, SEC_H);
        const ikon = await gambar(b.ikon);
        if (ikon) ctx.drawImage(ikon, 44, y + 6, 44, 44);
        ctx.fillStyle = b.warna; ctx.font = 'bold 30px sans-serif';
        ctx.fillText(b.tajuk, ikon ? 100 : 44, y + 38);
        y += SEC_H + 4;

        // kad barang
        for (let i = 0; i < senarai.length; i++) {
            const [id, item] = senarai[i];
            const x = 24 + i * (CARD_W + CARD_GAP), cy = y;
            ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x, cy, CARD_W, CARD_H);
            ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2; ctx.strokeRect(x, cy, CARD_W, CARD_H);

            const pic = await gambar(`${b.kat}_${id}`);
            if (pic) {
                const sc = Math.min((CARD_W - 24) / pic.width, 170 / pic.height);
                ctx.drawImage(pic, x + (CARD_W - pic.width * sc) / 2, cy + 10, pic.width * sc, pic.height * sc);
            } else {
                ctx.fillStyle = b.warna; ctx.font = '72px sans-serif'; ctx.textAlign = 'center';
                ctx.fillText(b.simbol, x + CARD_W / 2, cy + 110); ctx.textAlign = 'left';
            }
            ctx.fillStyle = '#ffffff'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(String(item.nama).slice(0, 18), x + CARD_W / 2, cy + 205);
            ctx.fillStyle = '#fde68a'; ctx.font = 'bold 22px sans-serif';
            ctx.fillText(rp(item.harga), x + CARD_W / 2, cy + 236);
            ctx.fillStyle = '#7dd3fc'; ctx.font = '18px sans-serif';
            ctx.fillText(`Level ${KEDAI_LV[b.kat]?.[id] || 1} · ${b.arahan} ${id}`, x + CARD_W / 2, cy + 270);
            ctx.textAlign = 'left';
        }
        y += CARD_H + GAP;
    }
    return c.toBuffer('image/png');
}
