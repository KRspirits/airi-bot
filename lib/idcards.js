import { createCanvas } from '@napi-rs/canvas';
import { AIRI, LOGO, paintAiri, paintLogo, TINTS } from './brand.js';
import { rr } from './card.js';

// =========================================================================
// 🪪 KAD PENGENALAN (IC) & KAD BANK - reka bentuk high-tech Airi's Corner.
// Data diambil dari profil pemain. Kad bank ikut baki bank (tier).
// =========================================================================

const W = 1012, H = 638; // nisbah kad kredit/IC (85.6 x 54 mm)

/** Tier kad bank ikut baki bank. Pure function. */
export function bankTier(bank = 0) {
    if (bank >= 100_000_000) return { nama: 'BLACK', label: 'Airi Black Card', warna: ['#0a0a0a', '#1f1f1f'], aksen: '#e7c76b', tint: 'rgba(231,199,107,0.22)' };
    if (bank >= 10_000_000)  return { nama: 'PLATINUM', label: 'Platinum', warna: ['#1d2a3a', '#4a5b74'], aksen: '#dfe6f0', tint: TINTS.cyan };
    if (bank >= 1_000_000)   return { nama: 'GOLD', label: 'Gold', warna: ['#4a3206', '#b8862b'], aksen: '#fbd46b', tint: TINTS.gold };
    return { nama: 'STANDARD', label: 'Standard', warna: ['#1b2538', '#33507a'], aksen: '#94a3b8', tint: TINTS.violet };
}

/** No. IC tiruan yang stabil dari id pemain (bukan nombor sebenar). */
export function icNumber(id = '') {
    let h = 2166136261;
    for (const ch of String(id)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
    const d = String(h).padStart(10, '0').slice(0, 10);
    return `${d.slice(0, 6)}-${d.slice(6, 8)}-${d.slice(8, 10)}${String(h % 9)}`;
}

function bars(ctx, x, y, w, h, seed) {
    let s = 0; for (const c of String(seed)) s = (s * 33 + c.charCodeAt(0)) >>> 0;
    let cx = x;
    while (cx < x + w) {
        s = (s * 1103515245 + 12345) >>> 0;
        const bw = 2 + (s % 5);
        ctx.fillRect(cx, y, bw, h);
        cx += bw + 2 + ((s >> 3) % 4);
    }
}

function grid(ctx, color) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.globalAlpha = 0.12;
    for (let x = 0; x < W; x += 36) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 36) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.restore();
}

function chip(ctx, x, y) {
    const g = ctx.createLinearGradient(x, y, x + 96, y + 74);
    g.addColorStop(0, '#f5d27a'); g.addColorStop(1, '#a8772a');
    ctx.fillStyle = g; rr(ctx, x, y, 96, 74, 12); ctx.fill();
    ctx.strokeStyle = 'rgba(80,50,10,0.6)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y + 37); ctx.lineTo(x + 96, y + 37); ctx.moveTo(x + 48, y); ctx.lineTo(x + 48, y + 74); ctx.stroke();
}

/** Kad IC high-tech. user = dokumen pemain dari database. */
export function renderIC(user, nama) {
    const c = createCanvas(W, H), ctx = c.getContext('2d');
    ctx.fillStyle = '#050a1a'; ctx.fillRect(0, 0, W, H);
    paintAiri(ctx, W, H, { alpha: 0.35, dark: 0.7, tint: TINTS.cyan });
    grid(ctx, '#38e8ff');

    // bingkai neon
    ctx.save(); ctx.shadowColor = '#38e8ff'; ctx.shadowBlur = 18; ctx.strokeStyle = '#38e8ff'; ctx.lineWidth = 4;
    rr(ctx, 16, 16, W - 32, H - 32, 30); ctx.stroke(); ctx.restore();

    // header
    ctx.fillStyle = '#38e8ff'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText("AIRI'S CORNER  ·  KAD PENGENALAN", 48, 66);
    ctx.fillStyle = '#7dd3fc'; ctx.font = '18px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText('CYBER OS  ·  VERIFIED', W - 48, 66);

    // foto (Airi sebagai gambar profil) dalam kotak HUD
    const px = 48, py = 110, pw = 260, ph = 330;
    ctx.save(); rr(ctx, px, py, pw, ph, 18); ctx.clip();
    if (AIRI) { const s = Math.max(pw / AIRI.width, ph / AIRI.height); ctx.drawImage(AIRI, px + (pw - AIRI.width * s) / 2, py + (ph - AIRI.height * s) / 2, AIRI.width * s, AIRI.height * s); }
    else { ctx.fillStyle = '#0b2a45'; ctx.fillRect(px, py, pw, ph); }
    ctx.restore();
    ctx.strokeStyle = '#38e8ff'; ctx.lineWidth = 3; rr(ctx, px, py, pw, ph, 18); ctx.stroke();
    // garisan imbasan
    ctx.fillStyle = 'rgba(56,232,255,0.35)'; ctx.fillRect(px, py + ph * 0.45, pw, 3);

    // medan data
    const tahap = Object.values(user.stats || {}).reduce((a, b) => a + (Number(b) || 0), 0);
    const daftar = user.createdAt ? new Date(user.createdAt).toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Tiada rekod';
    const gelaran = user.badges?.length ? user.badges[user.badges.length - 1] : 'Warga Biasa';
    const field = (label, value, y) => {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#7dd3fc'; ctx.font = 'bold 18px sans-serif'; ctx.fillText(label, 340, y);
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 34px sans-serif'; ctx.fillText(String(value).slice(0, 26), 340, y + 42);
    };
    field('NAMA', (nama || 'Warga Gelap').toUpperCase(), 170);
    field('NO. KAD PENGENALAN', icNumber(user.id), 262);
    field('TARIKH DAFTAR', daftar, 354);
    field('GELARAN', gelaran, 446);
    ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`Tahap: ${tahap}   ·   Badge: ${user.badges?.length || 0}`, 340, 530);

    // barcode & cip
    ctx.fillStyle = '#e2e8f0'; bars(ctx, 340, 548, 360, 40, user.id || 'airi');
    ctx.fillStyle = '#38e8ff'; ctx.font = '16px monospace'; ctx.textAlign = 'left';
    ctx.fillText(String(user.id || '').slice(0, 26), 340, 606);
    if (LOGO) { ctx.save(); ctx.globalAlpha = 0.95; ctx.drawImage(LOGO, W - 170, H - 170, 128, 128); ctx.restore(); }
    return c.toBuffer('image/png');
}

/** Kad bank ikut tier baki bank. */
export function renderBankCard(user, nama) {
    const t = bankTier(user.bank || 0);
    const c = createCanvas(W, H), ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, t.warna[0]); g.addColorStop(1, t.warna[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    paintAiri(ctx, W, H, { alpha: 0.28, dark: 0.45, tint: t.tint, shift: 0.12 });
    grid(ctx, t.aksen);

    ctx.fillStyle = t.aksen; ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText("AIRI'S CORNER BANK", 60, 96);
    ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(t.label.toUpperCase(), W - 60, 96);

    chip(ctx, 60, 170);

    // nombor kad: 16 digit tiruan, ditutup separa
    const digit = (user.id || '').replace(/\D/g, '').padEnd(12, '7').slice(0, 12);
    const nombor = `5210 ${digit.slice(0, 4)} ${digit.slice(4, 8)} ${digit.slice(8, 12)}`;
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 56px monospace'; ctx.textAlign = 'left';
    ctx.fillText(nombor, 60, 380);

    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = 'bold 22px sans-serif';
    ctx.fillText('PEMEGANG KAD', 60, 470);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 40px sans-serif';
    ctx.fillText((nama || 'WARGA GELAP').toUpperCase().slice(0, 28), 60, 520);

    const exp = new Date(); exp.setFullYear(exp.getFullYear() + 5);
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText('TAMAT', W - 60, 470);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 36px monospace';
    ctx.fillText(`${String(exp.getMonth() + 1).padStart(2, '0')}/${String(exp.getFullYear()).slice(2)}`, W - 60, 520);

    // baki (dipaparkan sebagai maklumat kad, bukan sebagai nombor sulit)
    ctx.fillStyle = t.aksen; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`Baki bank: RM ${Number(user.bank || 0).toLocaleString('en-US')}`, 60, 600);

    if (LOGO) { ctx.save(); ctx.globalAlpha = 0.9; ctx.drawImage(LOGO, W - 200, 130, 120, 120); ctx.restore(); }
    return c.toBuffer('image/png');
}
