import { levelOf } from './level.js';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { AIRI, LOGO, paintAiri, paintLogo, TINTS } from './brand.js';
import { rr } from './card.js';

// =========================================================================
// 🪪💳 KAD IC & KAD BANK 3D.
// Kad dilukis dengan bayang, kilap, cip emas, hologram dan timbul nombor,
// dengan sedikit kecondongan supaya nampak macam kad fizikal.
// Kad bank ikut tier baki bank: Standard < Gold < Platinum < Black.
// =========================================================================

const CW = 1012, CH = 638;            // saiz kad (nisbah kad kredit)
const KW = 1200, KH = 760;            // kanvas keseluruhan
const OX = 94, OY = 70;               // kedudukan kad dalam kanvas

export function bankTier(bank = 0) {
    if (bank >= 100_000_000) return { nama: 'BLACK', label: 'Airi Black Card', warna: ['#050505', '#1c1c1f'], aksen: '#e7c76b', tint: 'rgba(231,199,107,0.20)', logam: true };
    if (bank >= 10_000_000)  return { nama: 'PLATINUM', label: 'Platinum', warna: ['#2b3442', '#7a8ba3'], aksen: '#eef3fa', tint: TINTS.cyan, logam: true };
    if (bank >= 1_000_000)   return { nama: 'GOLD', label: 'Gold', warna: ['#5a3d08', '#c18f2e'], aksen: '#fde68a', tint: TINTS.gold, logam: false };
    return { nama: 'STANDARD', label: 'Standard', warna: ['#1b2538', '#3a5f8f'], aksen: '#cbd5e1', tint: TINTS.violet, logam: false };
}

/** No. IC tiruan yang stabil dari id pemain (bukan nombor sebenar). */
export function icNumber(id = '') {
    let h = 2166136261;
    for (const ch of String(id)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
    const d = String(h).padStart(10, '0').slice(0, 10);
    return `${d.slice(0, 6)}-${d.slice(6, 8)}-${d.slice(8, 10)}${String(h % 9)}`;
}

function latarKanvas(ctx) {
    const g = ctx.createRadialGradient(KW / 2, KH / 2, 80, KW / 2, KH / 2, KW * 0.75);
    g.addColorStop(0, '#16233d'); g.addColorStop(1, '#03060d');
    ctx.fillStyle = g; ctx.fillRect(0, 0, KW, KH);
    paintAiri(ctx, KW, KH, { alpha: 0.18, dark: 0.55, tint: TINTS.cyan });
}

function tilt(ctx) { ctx.setTransform(1, 0.035, -0.025, 1, OX, OY); }
function reset(ctx) { ctx.setTransform(1, 0, 0, 1, 0, 0); }

function badanKad(ctx, warna, aksen, logam) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 46; ctx.shadowOffsetY = 22;
    const g = ctx.createLinearGradient(0, 0, CW, CH);
    g.addColorStop(0, warna[0]); g.addColorStop(1, warna[1]);
    ctx.fillStyle = g; rr(ctx, 0, 0, CW, CH, 36); ctx.fill();
    ctx.restore();
    ctx.save(); rr(ctx, 0, 0, CW, CH, 36); ctx.clip();
    const kilap = ctx.createLinearGradient(0, 0, CW * 0.9, CH * 0.6);
    kilap.addColorStop(0, 'rgba(255,255,255,0.28)'); kilap.addColorStop(0.45, 'rgba(255,255,255,0.02)'); kilap.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = kilap; ctx.fillRect(0, 0, CW, CH);
    if (logam) {
        ctx.globalAlpha = 0.09;
        for (let x = -CH; x < CW; x += 14) { ctx.fillStyle = '#ffffff'; ctx.fillRect(x, 0, 2, CH); }
        ctx.globalAlpha = 1;
    }
    ctx.restore();
    ctx.save(); ctx.strokeStyle = aksen; ctx.globalAlpha = 0.85; ctx.lineWidth = 6; rr(ctx, 3, 3, CW - 6, CH - 6, 34); ctx.stroke(); ctx.restore();
}

function cip(ctx, x, y) {
    const g = ctx.createLinearGradient(x, y, x + 150, y + 112);
    g.addColorStop(0, '#fff1b8'); g.addColorStop(0.5, '#d4a13a'); g.addColorStop(1, '#8a5a12');
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4;
    ctx.fillStyle = g; rr(ctx, x, y, 150, 112, 18); ctx.fill(); ctx.restore();
    ctx.strokeStyle = 'rgba(80,45,5,0.7)'; ctx.lineWidth = 3;
    for (const dx of [50, 100]) { ctx.beginPath(); ctx.moveTo(x + dx, y + 8); ctx.lineTo(x + dx, y + 104); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(x + 8, y + 56); ctx.lineTo(x + 142, y + 56); ctx.stroke();
}

function hologram(ctx, x, y, w, h) {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, 'rgba(255,0,160,0.85)'); g.addColorStop(0.25, 'rgba(255,220,0,0.85)');
    g.addColorStop(0.5, 'rgba(0,255,200,0.85)'); g.addColorStop(0.75, 'rgba(60,120,255,0.85)'); g.addColorStop(1, 'rgba(190,60,255,0.85)');
    ctx.save(); ctx.globalAlpha = 0.9; ctx.fillStyle = g; rr(ctx, x, y, w, h, 14); ctx.fill(); ctx.restore();
    ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 6; i++) { ctx.fillRect(x + 8 + i * (w / 7), y + 6, 4, h - 12); }
    ctx.restore();
}

/** Teks timbul: bayang gelap di bawah, kilau di atas. */
function timbul(ctx, teks, x, y, px, warna, mono = false) {
    ctx.font = `bold ${px}px ${mono ? 'monospace' : 'sans-serif'}`;
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillText(teks, x + 2, y + 3);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillText(teks, x - 1, y - 1);
    ctx.fillStyle = warna; ctx.fillText(teks, x, y);
}

/** Kad bank 3D ikut tier baki bank. */
export function renderBankCard(user, nama) {
    const t = bankTier(user.bank || 0);
    const c = createCanvas(KW, KH), ctx = c.getContext('2d');
    latarKanvas(ctx);
    tilt(ctx);
    badanKad(ctx, t.warna, t.aksen, t.logam);

    ctx.save(); rr(ctx, 0, 0, CW, CH, 36); ctx.clip();
    paintAiri(ctx, CW, CH, { alpha: 0.16, dark: 0.35, tint: t.tint, shift: 0.1 });
    ctx.restore();

    timbul(ctx, "AIRI'S CORNER BANK", 64, 86, 40, t.aksen);
    ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'right'; ctx.fillStyle = t.aksen;
    ctx.fillText(t.label.toUpperCase(), CW - 64, 86); ctx.textAlign = 'left';

    cip(ctx, 64, 150);
    const digit = (user.id || '').replace(/\D/g, '').padEnd(12, '7').slice(0, 12);
    timbul(ctx, `5210  ${digit.slice(0, 4)}  ${digit.slice(4, 8)}  ${digit.slice(8, 12)}`, 64, 385, 60, '#f8fafc', true);

    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = 'bold 22px sans-serif';
    ctx.fillText('PEMEGANG KAD', 64, 470);
    timbul(ctx, (nama || 'WARGA GELAP').toUpperCase().slice(0, 26), 64, 522, 40, '#ffffff');

    const tamat = new Date(); tamat.setFullYear(tamat.getFullYear() + 5);
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText('TAMAT', CW - 230, 470);
    timbul(ctx, `${String(tamat.getMonth() + 1).padStart(2, '0')}/${String(tamat.getFullYear()).slice(2)}`, CW - 230, 522, 38, '#ffffff', true);
    ctx.textAlign = 'left';

    hologram(ctx, CW - 200, 130, 130, 92);
    ctx.fillStyle = t.aksen; ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`Baki: RM ${Number(user.bank || 0).toLocaleString('en-US')}`, 64, 598);
    if (LOGO) paintLogo(ctx, CW - 150, CH - 170, 110, 0.85);
    reset(ctx);
    return c.toBuffer('image/png');
}

/** Kad pengenalan 3D dengan gambar profil pemain (jika ada). */
export async function renderIC(user, nama, avatar = null) {
    const c = createCanvas(KW, KH), ctx = c.getContext('2d');
    latarKanvas(ctx);
    tilt(ctx);
    badanKad(ctx, ['#f1f5fb', '#c9d8ee'], '#1e4fa3', false);

    ctx.save(); ctx.fillStyle = '#1e4fa3'; rr(ctx, 0, 0, CW, 120, 36); ctx.fill(); ctx.fillRect(0, 84, CW, 36); ctx.restore();
    timbul(ctx, "AIRI'S CORNER  ·  KAD PENGENALAN", 56, 78, 40, '#ffffff');

    const px = 56, py = 170, pw = 270, ph = 340;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8;
    ctx.fillStyle = '#ffffff'; rr(ctx, px - 8, py - 8, pw + 16, ph + 16, 18); ctx.fill(); ctx.restore();
    ctx.save(); rr(ctx, px, py, pw, ph, 14); ctx.clip();
    let gambar = null;
    if (avatar) { try { gambar = await loadImage(avatar); } catch { gambar = null; } }
    const sumber = gambar || AIRI;
    if (sumber) { const s = Math.max(pw / sumber.width, ph / sumber.height); ctx.drawImage(sumber, px + (pw - sumber.width * s) / 2, py + (ph - sumber.height * s) / 2, sumber.width * s, sumber.height * s); }
    else { ctx.fillStyle = '#0b2a45'; ctx.fillRect(px, py, pw, ph); }
    ctx.restore();

    const tahap = levelOf(user);
    const xpTxt = (Number(user.xp) || 0).toLocaleString('en-US');
    const daftar = user.createdAt ? new Date(user.createdAt).toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Tiada rekod';
    // Gelaran: lencana terakhir yang bukan 'Ahli Baru' (lencana sambutan tak patut jadi gelaran kekal)
    const gelaranLayak = (user.badges || []).filter(b => b !== 'Ahli Baru');
    const gelaran = gelaranLayak.length ? gelaranLayak[gelaranLayak.length - 1] : 'Warga Biasa';
    const medan = (label, nilai, y) => {
        ctx.fillStyle = '#1e4fa3'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(label, 360, y);
        timbul(ctx, String(nilai).slice(0, 26), 360, y + 44, 36, '#0f172a');
    };
    medan('NAMA', (nama || 'Warga Gelap').toUpperCase(), 170);
    medan('NO. KAD PENGENALAN', icNumber(user.id), 262);
    medan('TARIKH DAFTAR', daftar, 354);
    medan('GELARAN', gelaran, 446);
    ctx.fillStyle = '#1e4fa3'; ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`Tahap ${tahap}   ·   XP ${xpTxt}`, 360, 530);

    ctx.fillStyle = '#0f172a';
    let s = 0; for (const ch of String(user.id || 'airi')) s = (s * 33 + ch.charCodeAt(0)) >>> 0;
    let bx = 360; while (bx < 760) { s = (s * 1103515245 + 12345) >>> 0; const bw = 2 + (s % 4); ctx.fillRect(bx, 548, bw, 40); bx += bw + 2 + ((s >> 3) % 3); }
    hologram(ctx, CW - 190, 150, 130, 92);
    reset(ctx);
    return c.toBuffer('image/png');
}

