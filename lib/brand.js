import { createCanvas, loadImage } from '@napi-rs/canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// =========================================================================
// 🎨 JENAMA AIRI'S CORNER
// assets/airi.png  = watak utama (latar setiap kad).
// assets/logo.png  = logo group (sudut kanan atas).
// Dimuatkan SEKALI masa bot start, supaya kad tak perlu baca fail setiap kali.
// Kalau fail tak ada, kad tetap jalan (tanpa gambar).
// =========================================================================

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function tryLoad(file) {
    const p = path.join(__dirname, '..', 'assets', file);
    if (!fs.existsSync(p)) return null;
    try { return await loadImage(p); } catch (e) { console.error('[BRAND]', file, e.message); return null; }
}

export const AIRI = await tryLoad('airi.png');
export const LOGO = await tryLoad('logo.png');

/** Lukis Airi sebagai watak utama, dipenuhkan ke kanvas (cover), dengan lapisan gelap supaya teks jelas. */
export function paintAiri(ctx, W, H, { alpha = 0.5, dark = 0.5, shift = 0 } = {}) {
    if (!AIRI) return;
    const s = Math.max(W / AIRI.width, H / AIRI.height) * 1.05;
    const dw = AIRI.width * s, dh = AIRI.height * s;
    const x = (W - dw) / 2 + shift * W, y = (H - dh) / 2;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(AIRI, x, y, dw, dh);
    ctx.restore();
    ctx.save();
    ctx.fillStyle = `rgba(6,12,36,${dark})`;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
}

/** Lukis logo group di kedudukan (x, y) dengan saiz persegi. */
export function paintLogo(ctx, x, y, size, alpha = 0.95) {
    if (!LOGO) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(LOGO, x, y, size, size);
    ctx.restore();
}

export const hasBrand = !!(AIRI || LOGO);
