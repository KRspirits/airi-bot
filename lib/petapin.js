import { createCanvas, loadImage } from '@napi-rs/canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DAERAH } from './daerah.js';
import { BANDAR } from './peta.js';
import { kedudukan } from './petaasli.js';

// 🗺️ PETA ORDER: gambar peta Malaysia sebenar dengan dua pin sahaja.
// 📍 = lokasi rider (ambil), 🏁 = tujuan. Tiada video, tiada zoom.
const DIR = path.dirname(fileURLToPath(import.meta.url));
const PETA = path.join(DIR, '..', 'assets', 'peta', 'malaysia.jpg');
const SKALA_ASAL = 2048; // kedudukan() pulangkan piksel dalam ruang 2048x2048

function pin(ctx, x, y, label, warna) {
    ctx.beginPath(); ctx.arc(x, y - 22, 16, 0, Math.PI * 2); ctx.fillStyle = warna; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 10, y - 14); ctx.lineTo(x, y + 4); ctx.lineTo(x + 10, y - 14); ctx.closePath(); ctx.fillStyle = warna; ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(label, x, y - 16);
}

export async function renderPetaPin({ dari, ke }) {
    const koorA = DAERAH.MY[dari] || BANDAR[dari];
    const koorB = DAERAH.MY[ke] || BANDAR[ke];
    if (!koorA || !koorB) return null;
    const img = await loadImage(fs.readFileSync(PETA));
    const W = 800, H = Math.round(img.height * W / img.width);
    const c = createCanvas(W, H), ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0, W, H);
    const [ax, ay] = kedudukan('MY', koorA[0], koorA[1]);
    const [bx, by] = kedudukan('MY', koorB[0], koorB[1]);
    const sx = W / SKALA_ASAL, sy = H / SKALA_ASAL;
    // garis putus-putus antara dua titik
    ctx.setLineDash([10, 8]); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(56,189,248,0.9)';
    ctx.beginPath(); ctx.moveTo(ax * sx, ay * sy); ctx.lineTo(bx * sx, by * sy); ctx.stroke(); ctx.setLineDash([]);
    pin(ctx, ax * sx, ay * sy, '📍', '#22c55e');
    pin(ctx, bx * sx, by * sy, '🏁', '#f97316');
    return c.toBuffer('image/png');
}
