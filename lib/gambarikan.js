import { loadImage, createCanvas } from '@napi-rs/canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// =========================================================================
// 🐟 GAMBAR IKAN SEBENAR. Dimuatkan sekali masa bot start dari assets/ikan/<rarity>/<slug>.png.
// Kalau gambar tak ada untuk satu ikan, pemanggil guna lukisan lama (fallback).
// =========================================================================

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ASET = path.join(DIR, '..', 'assets', 'ikan');
const RARITI = ['biasa', 'rare', 'mitos', 'sampah'];
const cache = new Map();

/** Slug nama ikan: buang emoji, nombor depan, simbol. Sama dengan nama fail dalam assets. */
export function slugIkan(nama) {
    const n = String(nama || '').replace(/^\d+\s+/, '').replace(/[^\x00-\x7F]+/g, '');
    return n.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

async function muatSemua() {
    for (const r of RARITI) {
        const dir = path.join(ASET, r);
        if (!fs.existsSync(dir)) continue;
        for (const f of fs.readdirSync(dir)) {
            if (!f.endsWith('.png')) continue;
            try {
                cache.set(`${r}/${f.slice(0, -4)}`, await loadImage(fs.readFileSync(path.join(dir, f))));
            } catch (e) {
                console.error('[GAMBAR IKAN]', f, e.message);
            }
        }
    }
}
await muatSemua().catch(e => console.error('[GAMBAR IKAN] gagal muat:', e.message));

/** Gambar ikan untuk rarity dan nama tertentu, atau null. */
export function gambarIkan(rarity, nama) {
    return cache.get(`${rarity}/${slugIkan(nama)}`) || null;
}

/** Lukis gambar ikan di (cx, cy) dalam kotak size. Siluet = versi gelap. Pulang true kalau berjaya. */
export function lukisIkan(ctx, rarity, nama, cx, cy, size, siluet = false) {
    const img = gambarIkan(rarity, nama);
    if (!img) return false;
    const s = Math.min(size / img.width, size / img.height);
    const w = img.width * s, h = img.height * s;
    if (!siluet) {
        ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
        return true;
    }
    const t = createCanvas(Math.max(1, Math.ceil(w)), Math.max(1, Math.ceil(h)));
    const tc = t.getContext('2d');
    tc.drawImage(img, 0, 0, w, h);
    tc.globalCompositeOperation = 'source-in';
    tc.fillStyle = '#0a0f26';
    tc.fillRect(0, 0, w, h);
    ctx.drawImage(t, cx - w / 2, cy - h / 2, w, h);
    return true;
}
