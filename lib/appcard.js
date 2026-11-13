import { createCanvas, loadImage } from '@napi-rs/canvas';
import fs from 'fs';

// Ikon app (logo) untuk setiap brand. Fail dalam assets/apps/.
const IKON = {
    GrabFood: new URL('../assets/apps/grab.png', import.meta.url),
    foodpanda: new URL('../assets/apps/foodpanda.png', import.meta.url),
};

async function muatIkon(brand) {
    try {
        const laluan = IKON[brand];
        if (!laluan || !fs.existsSync(laluan)) return null;
        return await loadImage(fs.readFileSync(laluan));
    } catch { return null; }
}

// =========================================================================
// 📱 KAD ORDER PENGHANTARAN. Setiap order ada rupa sendiri (warna, corak, tag, ETA, rating)
// yang ditentukan oleh ID order, jadi order yang berbeza nampak berbeza.
// Tema brand: GrabFood (hijau) dan foodpanda (merah jambu).
// =========================================================================

const TEMA = {
    GrabFood: { warna: '#00B14F', nama: 'GrabFood', palet: ['#00B14F', '#22c55e', '#10b981', '#15803d'] },
    foodpanda: { warna: '#D70F64', nama: 'foodpanda', palet: ['#D70F64', '#f43f5e', '#f97316', '#a855f7'] },
};
const TAG = ['PROMO', 'LARIS', 'TIP TINGGI', 'BARU', 'LAJU'];

function hash(teks) {
    let h = 2166136261;
    for (const ch of String(teks)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
    return h;
}

export async function renderAppOrders(brand, orders, tajuk = 'Order sedia diambil') {
    const ikon = await muatIkon(brand);
    const t = TEMA[brand] || TEMA.GrabFood;
    const W = 720, rowH = 150;
    const H = 150 + Math.max(1, orders.length) * rowH + 50;
    const c = createCanvas(W, H), ctx = c.getContext('2d');

    ctx.fillStyle = '#f2f2f2'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = t.warna; ctx.fillRect(0, 0, W, 130);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 48px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(t.nama, 36, 66);
    ctx.font = '22px sans-serif'; ctx.fillText(tajuk, 36, 104);
    if (ikon) {
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(W - 70, 65, 46, 0, Math.PI * 2); ctx.fill();
        ctx.save(); ctx.beginPath(); ctx.arc(W - 70, 65, 40, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(ikon, W - 110, 25, 80, 80); ctx.restore();
    }

    if (!orders.length) {
        ctx.fillStyle = '#555'; ctx.font = 'bold 30px sans-serif';
        ctx.fillText('Tiada order untuk ' + t.nama + ' sekarang.', 36, 200);
    }
    orders.forEach((o, i) => {
        const hsh = hash(o.id);
        const warna = t.palet[hsh % t.palet.length];
        const tag = TAG[(hsh >> 3) % TAG.length];
        const y = 150 + i * rowH;

        ctx.fillStyle = '#ffffff'; ctx.fillRect(24, y, W - 48, rowH - 16);
        ctx.fillStyle = warna; ctx.fillRect(24, y, 12, rowH - 16);

        // corak titik unik untuk order ini
        ctx.fillStyle = warna + '22';
        for (let k = 0; k < 14; k++) {
            const px = W - 60 - ((hsh >> (k % 20)) % 180), py = y + 20 + ((hsh >> (k + 3)) % 90);
            ctx.beginPath(); ctx.arc(px, py, 4 + (k % 3), 0, Math.PI * 2); ctx.fill();
        }

        ctx.fillStyle = '#111111'; ctx.font = 'bold 26px sans-serif';
        ctx.fillText(`#${o.id}  ${o.kedai}`, 52, y + 40);
        ctx.fillStyle = '#555555'; ctx.font = '20px sans-serif';
        ctx.fillText(`${o.dari}  →  ${o.ke}`, 52, y + 72);
        ctx.fillText(`${o.jarak} km  ·  ~${o.eta || Math.round(o.jarak * 2) + 3} min  ·  ★ ${o.rating || '4.7'}`, 52, y + 100);

        // tag bulat
        ctx.fillStyle = warna; ctx.font = 'bold 16px sans-serif';
        const lebar = ctx.measureText(tag).width + 22;
        ctx.fillRect(52, y + 110, lebar, 26);
        ctx.fillStyle = '#ffffff'; ctx.fillText(tag, 63, y + 129);

        ctx.fillStyle = warna; ctx.font = 'bold 34px sans-serif'; ctx.textAlign = 'right';
        ctx.fillText(`RM ${o.bayar}`, W - 52, y + 52);
        ctx.textAlign = 'left';
        if (o.tuntut) { ctx.fillStyle = '#999999'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'right'; ctx.fillText('DIAMBIL', W - 52, y + 100); ctx.textAlign = 'left'; }
    });
    ctx.fillStyle = '#666666'; ctx.font = '20px sans-serif';
    ctx.fillText('Taip .terima [id] untuk ambil order', 36, H - 16);
    return c.toBuffer('image/png');
}
