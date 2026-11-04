import { createCanvas } from '@napi-rs/canvas';

// =========================================================================
// 📱 KAD APP PENGHANTARAN. Tema ikut brand sebenar: GrabFood (hijau) dan foodpanda (merah jambu).
// Dilukis tanpa latar Airi supaya nampak macam skrin app sebenar.
// =========================================================================

const TEMA = {
    GrabFood: { warna: '#00B14F', nama: 'GrabFood' },
    foodpanda: { warna: '#D70F64', nama: 'foodpanda' },
};

export function renderAppOrders(brand, orders, tajuk = 'Order sedia diambil') {
    const t = TEMA[brand] || TEMA.GrabFood;
    const W = 720, baris = Math.max(1, orders.length), rowH = 130;
    const H = 150 + baris * rowH + 40;
    const c = createCanvas(W, H), ctx = c.getContext('2d');

    ctx.fillStyle = '#f2f2f2'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = t.warna; ctx.fillRect(0, 0, W, 130);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 48px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(t.nama, 36, 66);
    ctx.font = '22px sans-serif'; ctx.fillText(tajuk, 36, 104);

    if (!orders.length) {
        ctx.fillStyle = '#555'; ctx.font = 'bold 30px sans-serif';
        ctx.fillText('Tiada order untuk ' + t.nama + ' sekarang.', 36, 200);
    }
    orders.forEach((o, i) => {
        const y = 150 + i * rowH;
        ctx.fillStyle = '#ffffff'; ctx.fillRect(24, y, W - 48, rowH - 16);
        ctx.fillStyle = t.warna; ctx.fillRect(24, y, 10, rowH - 16);
        ctx.fillStyle = '#111111'; ctx.font = 'bold 26px sans-serif';
        ctx.fillText(`#${o.id}  ${o.kedai}`, 52, y + 40);
        ctx.fillStyle = '#555555'; ctx.font = '20px sans-serif';
        ctx.fillText(`${o.dari}  →  ${o.ke}`, 52, y + 72);
        ctx.fillText(`${o.jarak} km`, 52, y + 98);
        ctx.fillStyle = t.warna; ctx.font = 'bold 32px sans-serif'; ctx.textAlign = 'right';
        ctx.fillText(`RM ${o.bayar}`, W - 52, y + 50);
        ctx.textAlign = 'left';
        if (o.tuntut) { ctx.fillStyle = '#999999'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'right'; ctx.fillText('DIAMBIL', W - 52, y + 98); ctx.textAlign = 'left'; }
    });
    ctx.fillStyle = '#666666'; ctx.font = '20px sans-serif';
    ctx.fillText('Taip .terima [id] untuk ambil order', 36, H - 16);
    return c.toBuffer('image/png');
}
