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
export const TINTS = { pink: 'rgba(255,122,200,0.22)', cyan: 'rgba(56,232,255,0.20)', violet: 'rgba(167,139,250,0.24)', gold: 'rgba(251,191,36,0.20)', mint: 'rgba(74,222,128,0.18)', red: 'rgba(251,113,133,0.20)' };

export function paintAiri(ctx, W, H, { alpha = 0.5, dark = 0.5, shift = 0, tint = null } = {}) {
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
    if (tint) { ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = tint; ctx.fillRect(0, 0, W, H); }
    ctx.restore();
}

/** Lukis logo group di kedudukan (x, y) dengan saiz persegi. */
export function paintLogo(ctx, x, y, size, alpha = 1) {
    if (!LOGO) return;
    const r = size / 2, cx = x + r, cy = y + r;
    ctx.save();
    // latar bulat pekat supaya logo lama di bawah tak nampak
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#060c24';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
    ctx.globalAlpha = alpha;
    ctx.drawImage(LOGO, x, y, size, size);
    ctx.restore();
}

export const hasBrand = !!(AIRI || LOGO);
