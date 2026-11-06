import { createCanvas } from '@napi-rs/canvas';

// =========================================================================
// 🍉 KAD BUAH. Dilukis dalam bot (bukan foto). Setiap jenis buah ada bentuk dan warna sendiri.
// Dipaparkan untuk hasil Epik, Legenda, atau gred Premium dan Raja sahaja.
// =========================================================================

const GAYA = {
    durian: { warna: '#4d7c0f', bentuk: 'duri' },
    anggur: { warna: '#7e22ce', bentuk: 'kelompok' },
    epal: { warna: '#dc2626', bentuk: 'bulat' },
    oren: { warna: '#f97316', bentuk: 'bulat' },
    mangga: { warna: '#facc15', bentuk: 'oval' },
    rambutan: { warna: '#dc2626', bentuk: 'duri' },
    nanas: { warna: '#eab308', bentuk: 'oval' },
    pisang: { warna: '#fde047', bentuk: 'oval' },
    betik: { warna: '#fb923c', bentuk: 'oval' },
    strawberi: { warna: '#e11d48', bentuk: 'bulat' },
    limau: { warna: '#84cc16', bentuk: 'bulat' },
    cili: { warna: '#dc2626', bentuk: 'oval' },
    kangkung: { warna: '#16a34a', bentuk: 'helai' },
};
const NADIR = { Biasa: '#94a3b8', Langka: '#38bdf8', Epik: '#c084fc', Legenda: '#fbbf24' };

function bentukBuah(ctx, gaya, x, y, r) {
    ctx.fillStyle = gaya.warna;
    if (gaya.bentuk === 'duri') {
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#365314';
        for (let i = 0; i < 18; i++) {
            const a = (i / 18) * Math.PI * 2;
            ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * (r - 6), y + Math.sin(a) * (r - 6));
            ctx.lineTo(x + Math.cos(a) * (r + 14), y + Math.sin(a) * (r + 14));
            ctx.lineTo(x + Math.cos(a + 0.12) * (r - 6), y + Math.sin(a + 0.12) * (r - 6)); ctx.fill();
        }
    } else if (gaya.bentuk === 'kelompok') {
        for (let i = 0; i < 12; i++) {
            const cx = x - r * 0.5 + (i % 4) * r * 0.36, cy = y - r * 0.5 + Math.floor(i / 4) * r * 0.5;
            ctx.beginPath(); ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2); ctx.fill();
        }
    } else if (gaya.bentuk === 'oval') {
        ctx.beginPath(); ctx.ellipse(x, y, r * 0.75, r, 0, 0, Math.PI * 2); ctx.fill();
    } else if (gaya.bentuk === 'helai') {
        ctx.beginPath(); ctx.ellipse(x, y, r * 0.5, r, -0.4, 0, Math.PI * 2); ctx.fill();
    } else {
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.25, 0, Math.PI * 2); ctx.fill();
    }
}

export function drawBuah({ crop, nama, varieti, nadir = 'Biasa', gred, nilai }) {
    const W = 720, H = 720;
    const c = createCanvas(W, H), ctx = c.getContext('2d');
    const latar = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, W * 0.7);
    latar.addColorStop(0, '#1e293b'); latar.addColorStop(1, '#020617');
    ctx.fillStyle = latar; ctx.fillRect(0, 0, W, H);

    const gaya = GAYA[crop] || GAYA.epal;
    bentukBuah(ctx, gaya, W / 2, 330, 160);
    ctx.fillStyle = '#16a34a';
    ctx.beginPath(); ctx.ellipse(W / 2 + 60, 150, 52, 22, -0.6, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = NADIR[nadir] || '#fff';
    ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`${nadir.toUpperCase()}${gred ? ' · ' + gred : ''}`, W / 2, 560);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 40px sans-serif';
    ctx.fillText(String(nama).slice(0, 26), W / 2, 612);
    ctx.fillStyle = '#e2e8f0'; ctx.font = '30px sans-serif';
    ctx.fillText(String(varieti).slice(0, 32), W / 2, 656);
    ctx.fillStyle = '#fde68a'; ctx.font = 'bold 44px sans-serif';
    ctx.fillText(`RM ${Math.round(nilai).toLocaleString('en-US')}`, W / 2, 704);
    ctx.textAlign = 'left';
    return c.toBuffer('image/png');
}
