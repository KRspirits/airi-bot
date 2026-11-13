import { createCanvas } from '@napi-rs/canvas';

// =========================================================================
// 🗺️ PETA MALAYSIA (lakaran, bukan peta rasmi). Titik kota pakai koordinat anggaran.
// Titik ambil (oren) dan hantar (hijau) disambung dengan laluan putus-putus.
// =========================================================================

export const BANDAR = {
    'Kuala Lumpur': [3.139, 101.687], 'Petaling Jaya': [3.105, 101.606], 'Klang': [3.045, 101.445],
    'Shah Alam': [3.073, 101.518], 'Subang': [3.075, 101.585], 'Ampang': [3.150, 101.762],
    'Cheras': [3.070, 101.730], 'Johor Bahru': [1.493, 103.741], 'Ipoh': [4.598, 101.090],
    'Melaka': [2.190, 102.250], 'Seremban': [2.726, 101.942], 'Georgetown': [5.414, 100.329],
    'Kuantan': [3.816, 103.333], 'Kota Bharu': [6.126, 102.238],
};

export const PANTAI = [
    [100.3, 6.4], [100.1, 5.8], [100.4, 5.4], [100.3, 4.6], [100.5, 4.2], [101.0, 3.5], [101.4, 3.0], [101.4, 2.7],
    [101.8, 2.3], [102.2, 2.2], [102.6, 2.2], [103.4, 1.5], [103.5, 1.3], [104.0, 1.45], [103.7, 2.0], [103.4, 2.7],
    [103.3, 3.4], [103.4, 4.0], [103.5, 4.6], [103.2, 5.4], [102.5, 6.2], [101.6, 6.6], [100.8, 6.6],
];

const LON0 = 99.6, LON1 = 104.3, LAT0 = 1.0, LAT1 = 6.8;

export function tukar(lat, lon, W, H) {
    const x = (lon - LON0) / (LON1 - LON0) * W;
    const y = (LAT1 - lat) / (LAT1 - LAT0) * H;
    return [x, y];
}

/** Jarak lurus antara dua titik (km). */
export function jarakKm(a, b) {
    const [la1, lo1] = BANDAR[a], [la2, lo2] = BANDAR[b];
    const R = 6371, d2r = Math.PI / 180;
    const dLa = (la2 - la1) * d2r, dLo = (lo2 - lo1) * d2r;
    const h = Math.sin(dLa / 2) ** 2 + Math.cos(la1 * d2r) * Math.cos(la2 * d2r) * Math.sin(dLo / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}

/** Lukis peta dengan semua order: setiap order ada nombor, titik ambil, titik hantar dan laluan. */
export function petaOrder(orders) {
    const W = 900, H = 700;
    const c = createCanvas(W, H), ctx = c.getContext('2d');
    const laut = ctx.createLinearGradient(0, 0, 0, H);
    laut.addColorStop(0, '#0b2a4a'); laut.addColorStop(1, '#06182e');
    ctx.fillStyle = laut; ctx.fillRect(0, 0, W, H);

    ctx.beginPath();
    PANTAI.forEach(([lo, la], i) => { const [x, y] = tukar(la, lo, W, H); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.closePath();
    ctx.fillStyle = '#16452e'; ctx.fill();
    ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 3; ctx.stroke();

    ctx.fillStyle = 'rgba(148,163,184,0.7)'; ctx.font = '18px sans-serif';
    for (const [nama, [la, lo]] of Object.entries(BANDAR)) {
        const [x, y] = tukar(la, lo, W, H);
        ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillText(nama, x + 6, y - 4);
    }

    orders.forEach((o, i) => {
        const [xa, ya] = tukar(...BANDAR[o.dari], W, H), [xb, yb] = tukar(...BANDAR[o.ke], W, H);
        ctx.setLineDash([12, 8]); ctx.strokeStyle = o.brand === 'GrabFood' ? '#22c55e' : '#f43f5e'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(xb, yb); ctx.stroke(); ctx.setLineDash([]);
        const pin = (x, y, warna, teks) => {
            ctx.fillStyle = warna; ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#0f172a'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(teks, x, y + 6); ctx.textAlign = 'left';
        };
        pin(xa, ya, '#fb923c', String(i + 1));
        pin(xb, yb, '#22d3ee', String(i + 1));
    });
    return c.toBuffer('image/png');
}

/** Lukis latar laut dan semenanjung sahaja (untuk klip). */
export function lukisLatar(ctx, W, H) {
    const laut = ctx.createLinearGradient(0, 0, 0, H);
    laut.addColorStop(0, '#0b2a4a'); laut.addColorStop(1, '#06182e');
    ctx.fillStyle = laut; ctx.fillRect(0, 0, W, H);
    ctx.beginPath();
    PANTAI.forEach(([lo, la], i) => { const [x, y] = tukar(la, lo, W, H); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.closePath();
    ctx.fillStyle = '#16452e'; ctx.fill();
    ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 3; ctx.stroke();
}
