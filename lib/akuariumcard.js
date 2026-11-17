import { createCanvas, loadImage } from '@napi-rs/canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { gambarIkan, lukisIkan } from './gambarikan.js';
import { KEDAI } from './kedaidata.js';

// =========================================================================
// 🐠 KAD AKUARIUM. Gambar akuarium (ikut tahap) sebagai latar, dan setiap
// ikan yang disimpan dipaparkan dengan gambarnya sendiri, nama, dan buff.
// =========================================================================

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ASET = path.join(DIR, '..', 'assets', 'kedai');
const W = 1000, COLS = 4, CELL = 220;
const cache = new Map();

async function gambarKedai(nama) {
    if (cache.has(nama)) return cache.get(nama);
    const f = path.join(ASET, `${nama}.png`);
    const img = fs.existsSync(f) ? await loadImage(fs.readFileSync(f)).catch(() => null) : null;
    cache.set(nama, img);
    return img;
}

// Cari tahap akuarium dari nama (1..5), supaya gambar akuarium sepadan
function tahapAkuarium(ak) {
    const hit = Object.entries(KEDAI.akuarium || {}).find(([, it]) => it.nama === ak.nama);
    return hit ? hit[0] : '1';
}

export async function renderAkuarium(ak) {
    const ikan = ak.ikan || [];
    const baris = Math.max(1, Math.ceil(Math.max(ikan.length, 1) / COLS));
    const H = 170 + baris * (CELL + 24) + 60;
    const c = createCanvas(W, H), ctx = c.getContext('2d');

    // latar: gambar akuarium tahap ini
    const latar = await gambarKedai(`akuarium_${tahapAkuarium(ak)}`);
    ctx.fillStyle = '#06182e'; ctx.fillRect(0, 0, W, H);
    if (latar) {
        const sc = Math.max(W / latar.width, H / latar.height);
        ctx.globalAlpha = 0.45;
        ctx.drawImage(latar, (W - latar.width * sc) / 2, (H - latar.height * sc) / 2, latar.width * sc, latar.height * sc);
        ctx.globalAlpha = 1;
    }
    ctx.fillStyle = 'rgba(6,24,46,0.55)'; ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 46px sans-serif';
    ctx.fillText(String(ak.nama || 'AKUARIUM').toUpperCase(), 36, 70);
    ctx.fillStyle = '#7dd3fc'; ctx.font = '26px sans-serif';
    ctx.fillText(`Slot ${ikan.length}/${ak.slot || 1}`, 36, 110);

    if (!ikan.length) {
        ctx.fillStyle = '#e2e8f0'; ctx.font = '30px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Air kosong lagi. Simpan ikan dengan .akuarium [no]', W / 2, 260);
        ctx.textAlign = 'left';
        return c.toBuffer('image/png');
    }

    for (let i = 0; i < ikan.length; i++) {
        const it = ikan[i];
        const x = 20 + (i % COLS) * (CELL + 10), y = 150 + Math.floor(i / COLS) * (CELL + 24);
        ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(x, y, CELL, CELL + 16);
        const rarity = it.rarity || 'biasa';
        if (!lukisIkan(ctx, rarity, it.nama, x + CELL / 2, y + 100, 170)) {
            ctx.fillStyle = '#7dd3fc'; ctx.font = '60px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('🐟', x + CELL / 2, y + 120); ctx.textAlign = 'left';
        }
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(String(it.nama || '').replace(/[^\x00-\x7F\u00C0-\u024F ]+/g, '').trim().slice(0, 20), x + CELL / 2, y + 200);
        ctx.fillStyle = '#bbf7d0'; ctx.font = '15px sans-serif';
        ctx.fillText(String(it.buff || 'Tiada').slice(0, 26), x + CELL / 2, y + 224);
        ctx.textAlign = 'left';
    }
    return c.toBuffer('image/png');
}
