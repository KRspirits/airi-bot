import { loadImage } from '@napi-rs/canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 🖼️ BINGKAI IKAN. Bingkai kad ikan ikut tier, dimuat sekali masa bot start dari assets/ikan/bingkai/.
// Guna drawBingkaiIkan(ctx, tier, x, y, w, h) selepas gambar ikan dilukis.
const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'ikan', 'bingkai');
const TIER_FAIL = { biasa: 'basic', rare: 'rare', epic: 'epic', legend: 'legend', mitos: 'mythic', secret: 'secret' };
const cache = new Map();

for (const [tier, nama] of Object.entries(TIER_FAIL)) {
    const f = path.join(DIR, `${nama}.png`);
    if (!fs.existsSync(f)) continue;
    loadImage(fs.readFileSync(f)).then(img => cache.set(tier, img)).catch(() => {});
}

/** Lukis bingkai tier di atas kawasan (x,y,w,h). Tak buat apa-apa kalau bingkai tiada. */
export function drawBingkaiIkan(ctx, tier, x, y, w, h) {
    const img = cache.get(tier);
    if (img) ctx.drawImage(img, x, y, w, h);
    return !!img;
}
