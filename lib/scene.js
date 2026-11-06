import { createCanvas } from '@napi-rs/canvas';
import { rr } from './card.js';
import { cached } from './imgcache.js';

// =========================================================================
// 🎬 KAD ADEGAN JENAYAH. Dilukis dalam bot (tiada API, tiada gambar luar).
//   'tangkap' : kereta polis dengan lampu merah-biru berkelip
//   'rompak'  : pencuri bertopeng sedang lari dengan beg
//   'lokap'   : jeriji penjara dan mangga
// =========================================================================

const W = 720, H = 720;

function langit(ctx, dua) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, dua[0]); g.addColorStop(1, dua[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

function bangunan(ctx, seed) {
    let s = seed;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 9; i++) {
        const x = i * 84 - 10, t = 220 + rnd() * 180;
        ctx.fillStyle = 'rgba(12,16,34,0.95)'; ctx.fillRect(x, t, 90, H - t);
        for (let wy = t + 16; wy < H - 40; wy += 26) for (let wx = x + 10; wx < x + 80; wx += 20) {
            if (rnd() > 0.6) { ctx.fillStyle = 'rgba(251,191,36,0.55)'; ctx.fillRect(wx, wy, 8, 10); }
        }
    }
}

function label(ctx, teks, warna) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, 86);
    ctx.fillStyle = warna; ctx.font = 'bold 44px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(teks, 36, 60);
}

function kereta(ctx) {
    // lampu berkelip (glow)
    const merah = ctx.createRadialGradient(330, 380, 4, 330, 380, 140);
    merah.addColorStop(0, 'rgba(255,40,60,0.9)'); merah.addColorStop(1, 'rgba(255,40,60,0)');
    const biru = ctx.createRadialGradient(400, 380, 4, 400, 380, 140);
    biru.addColorStop(0, 'rgba(60,140,255,0.9)'); biru.addColorStop(1, 'rgba(60,140,255,0)');
    ctx.fillStyle = merah; ctx.fillRect(160, 220, 340, 320);
    ctx.fillStyle = biru; ctx.fillRect(190, 220, 340, 320);
    // badan
    ctx.fillStyle = '#f8fafc'; rr(ctx, 110, 470, 500, 120, 26); ctx.fill();
    ctx.fillStyle = '#e2e8f0'; rr(ctx, 220, 400, 280, 100, 30); ctx.fill();
    // tingkap & jalur
    ctx.fillStyle = '#1e293b'; rr(ctx, 240, 418, 110, 60, 12); ctx.fill();
    rr(ctx, 370, 418, 110, 60, 12); ctx.fill();
    ctx.fillStyle = '#1d4ed8'; ctx.fillRect(110, 540, 500, 16);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 34px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('POLIS', 360, 585);
    // bar lampu
    ctx.fillStyle = '#ef4444'; rr(ctx, 300, 372, 60, 30, 8); ctx.fill();
    ctx.fillStyle = '#3b82f6'; rr(ctx, 365, 372, 60, 30, 8); ctx.fill();
    // roda
    for (const x of [230, 490]) {
        ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(x, 596, 46, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#94a3b8'; ctx.beginPath(); ctx.arc(x, 596, 18, 0, Math.PI * 2); ctx.fill();
    }
    ctx.textAlign = 'left';
}

function pencuri(ctx) {
    ctx.fillStyle = '#0b0b10';
    ctx.beginPath(); ctx.arc(330, 440, 34, 0, Math.PI * 2); ctx.fill();          // kepala
    ctx.fillStyle = '#dc2626'; ctx.fillRect(312, 430, 36, 12);                      // topeng merah
    ctx.fillStyle = '#0b0b10'; rr(ctx, 300, 476, 62, 120, 18); ctx.fill(); // badan
    ctx.strokeStyle = '#0b0b10'; ctx.lineWidth = 16; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(310, 590); ctx.lineTo(268, 660); ctx.stroke();    // kaki kiri
    ctx.beginPath(); ctx.moveTo(352, 590); ctx.lineTo(408, 648); ctx.stroke();    // kaki kanan
    ctx.beginPath(); ctx.moveTo(300, 500); ctx.lineTo(250, 548); ctx.stroke();    // tangan kiri
    ctx.fillStyle = '#facc15'; rr(ctx, 400, 520, 90, 74, 12); ctx.fill(); // beg hasil
    ctx.fillStyle = '#92400e'; ctx.fillRect(412, 514, 66, 10);
    ctx.fillStyle = '#fef08a'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('RM', 445, 566); ctx.textAlign = 'left';
    // garisan kelajuan
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 4;
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(60, 500 + i * 26); ctx.lineTo(180 - i * 10, 500 + i * 26); ctx.stroke(); }
    ctx.lineCap = 'butt';
}

function jeriji(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 14;
    for (let x = 60; x < W; x += 80) { ctx.beginPath(); ctx.moveTo(x, 90); ctx.lineTo(x, H); ctx.stroke(); }
    ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(0, 300); ctx.lineTo(W, 300); ctx.stroke();
    // mangga
    ctx.fillStyle = '#facc15'; rr(ctx, 300, 430, 120, 110, 18); ctx.fill();
    ctx.strokeStyle = '#facc15'; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(360, 430, 42, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = '#78350f'; ctx.beginPath(); ctx.arc(360, 480, 10, 0, Math.PI * 2); ctx.fill();
}

function lari(ctx) {
    langit(ctx, ['#050812', '#1b1f3a']);
    ctx.fillStyle = '#1f2937'; ctx.fillRect(0, 470, W, 250);
    ctx.strokeStyle = '#facc15'; ctx.lineWidth = 8;
    for (let x = 0; x < W; x += 120) { ctx.beginPath(); ctx.moveTo(x, 600); ctx.lineTo(x + 60, 600); ctx.stroke(); }
    ctx.fillStyle = '#334155'; rr(ctx, 170, 400, 380, 120, 26); ctx.fill();
    ctx.fillStyle = '#0f172a'; rr(ctx, 260, 340, 200, 80, 22); ctx.fill();
    for (const x of [230, 480]) { ctx.fillStyle = '#020617'; ctx.beginPath(); ctx.arc(x, 530, 40, 0, Math.PI * 2); ctx.fill(); }
    const lampu = ctx.createRadialGradient(360, 360, 6, 360, 360, 220);
    lampu.addColorStop(0, 'rgba(239,68,68,0.6)'); lampu.addColorStop(1, 'rgba(239,68,68,0)');
    ctx.fillStyle = lampu; ctx.fillRect(0, 120, W, 400);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('KEJAR!', W / 2, 220); ctx.textAlign = 'left';
    label(ctx, 'POLIS KEJAR', '#fbbf24');
}

function saman(ctx) {
    langit(ctx, ['#0b1020', '#1e2a4a']);
    ctx.fillStyle = '#fef3c7'; rr(ctx, 130, 170, 460, 380, 22); ctx.fill();
    ctx.fillStyle = '#b91c1c'; ctx.fillRect(130, 170, 460, 70);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('NOTIS SAMAN', 360, 216);
    ctx.fillStyle = '#1f2937'; ctx.font = 'bold 30px sans-serif';
    ctx.fillText('Kesalahan: Lampu merah', 360, 300);
    ctx.fillText('Denda: RM 300', 360, 350);
    ctx.font = '22px sans-serif'; ctx.fillStyle = '#4b5563';
    ctx.fillText('Bayar dalam 14 hari', 360, 410);
    ctx.textAlign = 'left';
    label(ctx, 'SAMAN JALAN RAYA', '#f87171');
}

function jackpot(ctx) {
    langit(ctx, ['#0a0700', '#2a1a02']);
    const cahaya = ctx.createRadialGradient(W / 2, 380, 20, W / 2, 380, 340);
    cahaya.addColorStop(0, 'rgba(251,191,36,0.85)'); cahaya.addColorStop(1, 'rgba(251,191,36,0)');
    ctx.fillStyle = cahaya; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(253,230,138,0.5)'; ctx.lineWidth = 6;
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(W / 2, 380); ctx.lineTo(W / 2 + Math.cos(a) * 340, 380 + Math.sin(a) * 340); ctx.stroke(); }
    for (let i = 0; i < 26; i++) {
        const x = 90 + ((i * 97) % 540), y = 150 + ((i * 53) % 460);
        ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(x, y, 14 + (i % 3) * 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fef9c3'; ctx.beginPath(); ctx.arc(x - 4, y - 4, 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#fde68a'; ctx.font = 'bold 110px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('JACKPOT', W / 2, 400);
    ctx.font = 'bold 40px sans-serif'; ctx.fillStyle = '#fff7ed';
    ctx.fillText('MENANG BESAR!', W / 2, 460);
    ctx.textAlign = 'left';
}

function streak(ctx, hari) {
    langit(ctx, ['#050a1c', '#0e2148']);
    const api = ctx.createLinearGradient(0, 520, 0, 180);
    api.addColorStop(0, '#f97316'); api.addColorStop(0.5, '#fbbf24'); api.addColorStop(1, 'rgba(254,249,195,0.2)');
    ctx.fillStyle = api; ctx.beginPath(); ctx.moveTo(360, 170); ctx.bezierCurveTo(470, 330, 430, 430, 360, 540); ctx.bezierCurveTo(290, 430, 250, 330, 360, 170); ctx.fill();
    ctx.fillStyle = '#fff7ed'; ctx.beginPath(); ctx.moveTo(360, 300); ctx.bezierCurveTo(400, 370, 390, 430, 360, 480); ctx.bezierCurveTo(330, 430, 320, 370, 360, 300); ctx.fill();
    ctx.fillStyle = '#fde68a'; ctx.font = 'bold 150px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(String(hari), W / 2, 640);
    ctx.font = 'bold 36px sans-serif'; ctx.fillStyle = '#bfdbfe';
    ctx.fillText('HARI BERTURUT-TURUT', W / 2, 690);
    ctx.textAlign = 'left';
}

/** Pulang gambar PNG adegan untuk jenis tertentu. 'tangkap', 'rompak', 'lokap', 'jackpot', 'streak' (perlu hari). */
export function sceneCard(jenis = 'rompak', hari = 7) {
    return cached(`scene:${jenis}:${hari}`, () => buatScene(jenis, hari));
}

function buatScene(jenis, hari) {
    const c = createCanvas(W, H), ctx = c.getContext('2d');
    if (jenis === 'jackpot') { jackpot(ctx); return c.toBuffer('image/png'); }
    if (jenis === 'lari') { lari(ctx); return c.toBuffer('image/png'); }
    if (jenis === 'saman') { saman(ctx); return c.toBuffer('image/png'); }
    if (jenis === 'streak') { streak(ctx, hari); return c.toBuffer('image/png'); }
    if (jenis === 'tangkap') {
        langit(ctx, ['#060912', '#16204a']); bangunan(ctx, 7); kereta(ctx);
        label(ctx, 'KANTOI! POLIS DATANG', '#f87171');
    } else if (jenis === 'lokap') {
        langit(ctx, ['#08080c', '#1c1c26']); jeriji(ctx);
        label(ctx, 'DI BELAKANG JERIJI', '#cbd5e1');
    } else {
        langit(ctx, ['#06070f', '#1d1233']); bangunan(ctx, 11); pencuri(ctx);
        label(ctx, 'MISI BERJAYA', '#fbbf24');
    }
    return c.toBuffer('image/png');
}
