import { createCanvas, loadImage } from '@napi-rs/canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DAERAH } from './daerah.js';

// =========================================================================
// 🗺️ PETA SEBENAR (gambar yang kau bagi) + ZOOM ke kawasan order + logo app.
// Pemetaan koordinat -> piksel dikira dari titik anchor (anggaran, boleh laras).
// =========================================================================

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ASET = path.join(DIR, '..', 'assets');

// Koefisien: x = a*lon + b*lat + c ; y = d*lon + e*lat + f  (dalam piksel imej 2048x2048)
const KOEF = {
    MY: { x: [86.59, -14.82, -8320.34], y: [2.027, -144.507, 992.739], fail: 'peta/malaysia.jpg' },
};
const LOGO = { grab: 'apps/grab.png', foodpanda: 'apps/foodpanda.png', poslaju: 'apps/poslaju.png' };
const SAIZ_OUT = 800;

export function kedudukan(negara, lat, lon) {
    const k = KOEF[negara];
    return [k.x[0] * lon + k.x[1] * lat + k.x[2], k.y[0] * lon + k.y[1] * lat + k.y[2]];
}

/** Lukis peta sebenar, zoom ke kawasan order, dan letak nombor order + logo app. */
export async function petaOrderAsli(negara, orders, app) {
    const k = KOEF[negara];
    const img = await loadImage(fs.readFileSync(path.join(ASET, k.fail)));
    const titik = [];
    for (const o of orders) {
        const a = DAERAH[negara][o.dari], b = DAERAH[negara][o.ke];
        if (a) titik.push(kedudukan(negara, a[0], a[1]));
        if (b) titik.push(kedudukan(negara, b[0], b[1]));
    }
    // kawasan zoom: kotak yang merangkumi semua titik + margin, minimum 700 piksel
    let x0 = 0, y0 = 0, x1 = img.width, y1 = img.height;
    if (titik.length) {
        const xs = titik.map(p => p[0]), ys = titik.map(p => p[1]);
        const pad = 220;
        x0 = Math.max(0, Math.min(...xs) - pad); y0 = Math.max(0, Math.min(...ys) - pad);
        x1 = Math.min(img.width, Math.max(...xs) + pad); y1 = Math.min(img.height, Math.max(...ys) + pad);
        const lebar = x1 - x0, tinggi = y1 - y0, minSaiz = 700;
        if (lebar < minSaiz) { const tambah = (minSaiz - lebar) / 2; x0 = Math.max(0, x0 - tambah); x1 = Math.min(img.width, x1 + tambah); }
        if (tinggi < minSaiz) { const tambah = (minSaiz - tinggi) / 2; y0 = Math.max(0, y0 - tambah); y1 = Math.min(img.height, y1 + tambah); }
    }
    const sw = x1 - x0, sh = y1 - y0, skala = SAIZ_OUT / Math.max(sw, sh);
    const c = createCanvas(SAIZ_OUT, SAIZ_OUT), ctx = c.getContext('2d');
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, SAIZ_OUT, SAIZ_OUT);
    const ox = (SAIZ_OUT - sw * skala) / 2, oy = (SAIZ_OUT - sh * skala) / 2;
    ctx.drawImage(img, x0, y0, sw, sh, ox, oy, sw * skala, sh * skala);
    const map = (p) => [(p[0] - x0) * skala + ox, (p[1] - y0) * skala + oy];

    orders.forEach((o, i) => {
        const a = DAERAH[negara][o.dari], b = DAERAH[negara][o.ke];
        if (!a || !b) return;
        const [xa, ya] = map(kedudukan(negara, a[0], a[1])), [xb, yb] = map(kedudukan(negara, b[0], b[1]));
        ctx.setLineDash([12, 8]); ctx.strokeStyle = 'rgba(250,204,21,0.9)'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(xb, yb); ctx.stroke(); ctx.setLineDash([]);
        const pin = (x, y, warna, teks) => {
            ctx.fillStyle = warna; ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.stroke();
            ctx.fillStyle = '#0f172a'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(teks, x, y + 6); ctx.textAlign = 'left';
        };
        pin(xa, ya, '#fb923c', String(i + 1));
        pin(xb, yb, '#22d3ee', String(i + 1));
    });

    // logo app di sudut kanan atas
    const failLogo = LOGO[app];
    if (failLogo && fs.existsSync(path.join(ASET, failLogo))) {
        try {
            const logo = await loadImage(fs.readFileSync(path.join(ASET, failLogo)));
            ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.beginPath(); ctx.arc(SAIZ_OUT - 60, 60, 46, 0, Math.PI * 2); ctx.fill();
            ctx.save(); ctx.beginPath(); ctx.arc(SAIZ_OUT - 60, 60, 40, 0, Math.PI * 2); ctx.clip();
            ctx.drawImage(logo, SAIZ_OUT - 100, 20, 80, 80); ctx.restore();
        } catch { /* logo rosak: lepaskan */ }
    }
    return c.toBuffer('image/png');
}
