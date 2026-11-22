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
const W = 1200, HEAD = 150, SEC_H = 56, CARD_H = 350, GAP = 20, ROW_GAP = 16, LAJUR = 5;
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
// Pecahkan teks mengikut lebar kad (ikut perkataan).
function wrapTeks(teks, maxW, ctx) {
    const perkataan = teks.split(' ');
    const baris = []; let semasa = '';
    for (const p of perkataan) {
        const cuba = semasa ? `${semasa} ${p}` : p;
        if (ctx.measureText(cuba).width > maxW && semasa) { baris.push(semasa); semasa = p; }
        else semasa = cuba;
    }
    if (semasa) baris.push(semasa);
    return baris;
}


export async function renderKedai() {
    const latar = await gambar('kedai_latar');
    // Setiap kategori: 5 barang sebaris, sehingga 10 barang (2 baris)
    const bilBaris = b => Math.ceil(Object.keys(KEDAI[b.kat] || {}).length / LAJUR);
    const H = HEAD + BAHAGIAN.reduce((t, b) => t + SEC_H + 4 + bilBaris(b) * (CARD_H + ROW_GAP) + GAP, 0) + 40;
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
            const lajur = i % LAJUR, rowIdx = Math.floor(i / LAJUR);
            const x = 24 + lajur * (CARD_W + CARD_GAP), cy = y + rowIdx * (CARD_H + ROW_GAP);
            ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x, cy, CARD_W, CARD_H);
            ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2; ctx.strokeRect(x, cy, CARD_W, CARD_H);

            const pic = await gambar(`${b.kat}_${id}`);
            if (pic) {
                const sc = Math.min((CARD_W - 24) / pic.width, 140 / pic.height);
                ctx.drawImage(pic, x + (CARD_W - pic.width * sc) / 2, cy + 10, pic.width * sc, pic.height * sc);
            } else {
                ctx.fillStyle = b.warna; ctx.font = '72px sans-serif'; ctx.textAlign = 'center';
                ctx.fillText(b.simbol, x + CARD_W / 2, cy + 110); ctx.textAlign = 'left';
            }
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffffff'; ctx.font = 'bold 20px sans-serif';
            ctx.fillText(String(item.nama).slice(0, 18), x + CARD_W / 2, cy + 180);
            // kesan / buff item: dibahagi kepada beberapa baris supaya tak terpotong
            ctx.fillStyle = '#bbf7d0'; ctx.font = '16px sans-serif';
            const baris = wrapTeks(String(item.ket || '—'), CARD_W - 24, ctx);
            baris.slice(0, 3).forEach((t, k) => ctx.fillText(t, x + CARD_W / 2, cy + 206 + k * 19));
            ctx.fillStyle = '#fde68a'; ctx.font = 'bold 22px sans-serif';
            ctx.fillText(rp(item.harga), x + CARD_W / 2, cy + 286);
            ctx.fillStyle = '#7dd3fc'; ctx.font = '17px sans-serif';
            ctx.fillText(`${b.arahan} ${id}`, x + CARD_W / 2, cy + 322);
            ctx.textAlign = 'left';
        }
        y += bilBaris(b) * (CARD_H + ROW_GAP) + GAP;
    }
    return c.toBuffer('image/png');
}
