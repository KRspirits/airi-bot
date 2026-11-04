import { createCanvas } from '@napi-rs/canvas';

// Carta candle hitam dengan neon, dilukis dari sejarah harga sebenar yang disimpan.
export function renderCandles(candles, { title = 'PASARAN', subtitle = '', harga = 0 } = {}) {
    const W = 900, H = 560;
    const c = createCanvas(W, H), ctx = c.getContext('2d');
    ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#00e5ff'; ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(title, 40, 60);
    ctx.fillStyle = '#7dd3fc'; ctx.font = '22px sans-serif';
    ctx.fillText(subtitle, 40, 96);
    ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 34px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText('RM ' + Math.round(harga).toLocaleString('en-US'), W - 40, 96);
    ctx.textAlign = 'left';

    const pad = { l: 110, r: 40, t: 130, b: 60 };
    const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
    const hi = Math.max(...candles.map(k => k.h)), lo = Math.min(...candles.map(k => k.l));
    const span = (hi - lo) || 1;
    const yPx = v => pad.t + ph * (1 - (v - lo) / span);

    ctx.strokeStyle = 'rgba(0,229,255,0.12)'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const yy = pad.t + ph * i / 4;
        ctx.beginPath(); ctx.moveTo(pad.l, yy); ctx.lineTo(W - pad.r, yy); ctx.stroke();
        ctx.fillStyle = '#64748b'; ctx.font = '16px sans-serif';
        ctx.fillText(Math.round(hi - span * i / 4).toLocaleString('en-US'), 8, yy + 6);
    }

    const cw = pw / Math.max(1, candles.length);
    candles.forEach((k, i) => {
        const x = pad.l + i * cw + cw / 2;
        const naik = k.c >= k.o;
        const warna = naik ? '#22c55e' : '#ef4444';
        ctx.strokeStyle = warna; ctx.fillStyle = warna; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, yPx(k.h)); ctx.lineTo(x, yPx(k.l)); ctx.stroke();
        const atas = yPx(Math.max(k.o, k.c)), bawah = yPx(Math.min(k.o, k.c));
        ctx.fillRect(x - cw * 0.3, atas, cw * 0.6, Math.max(2, bawah - atas));
    });
    return c.toBuffer('image/png');
}
