import { createCanvas } from '@napi-rs/canvas';

// 🏷️ KAD SENARAI GELARAN. Gambar senarai gelaran yang pemain ada, dengan nombor pilihan.
export function renderSenaraiGelaran(senarai, aktif) {
    const W = 720, baris = senarai.length, H = 150 + baris * 62 + 40;
    const c = createCanvas(W, H), ctx = c.getContext('2d');
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#1e3a5f'; ctx.fillRect(0, 0, W, 110);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('🏷️ GELARAN SAYA', 30, 60);
    ctx.fillStyle = '#7dd3fc'; ctx.font = '22px sans-serif';
    ctx.fillText('Balas nombor untuk pilih gelaran', 30, 92);
    senarai.forEach((g, i) => {
        const y = 130 + i * 62;
        const dipilih = g === aktif;
        ctx.fillStyle = dipilih ? 'rgba(253,230,138,0.18)' : 'rgba(255,255,255,0.06)';
        ctx.fillRect(20, y, W - 40, 52);
        ctx.fillStyle = dipilih ? '#fde68a' : '#e2e8f0'; ctx.font = 'bold 26px sans-serif';
        ctx.fillText(`${i + 1}. ${g}${dipilih ? '  ✓ (dipakai)' : ''}`, 36, y + 35);
    });
    return c.toBuffer('image/png');
}
