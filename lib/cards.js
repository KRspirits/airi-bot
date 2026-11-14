import { lukisIkan } from './gambarikan.js';
import { paintAiri, paintLogo, TINTS } from './brand.js';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { fnt, rr, fit, wrap, strip, hash, rng, RARITY, drawCreature } from './card.js';

// =========================================================================
// 🎀 AIRI'S CORNER - KAD UI
// Semua kad dilukis dalam kod (tanpa emoji, tanpa aset luar) supaya jalan di Render.
// Tema: neon pastel (merah jambu + sian) di atas biru malam, bersinar-sinar.
// Semua fungsi pulangkan Buffer JPEG. Hantar guna lib/render.js -> sendCard().
// =========================================================================

export const THEME = { pink: '#ff7ac8', cyan: '#38e8ff', violet: '#a78bfa', gold: '#fbbf24', mint: '#4ade80', red: '#fb7185' };
const HEX = n => Math.round(n * 255).toString(16).padStart(2, '0');

function glow(ctx, x, y, rad, color, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, color + HEX(a)); g.addColorStop(1, color + '00');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill();
}
function sparkle(ctx, x, y, r, a) {
    ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.beginPath();
    ctx.moveTo(x, y - r * 2); ctx.quadraticCurveTo(x, y, x + r * 2, y); ctx.quadraticCurveTo(x, y, x, y + r * 2);
    ctx.quadraticCurveTo(x, y, x - r * 2, y); ctx.quadraticCurveTo(x, y, x, y - r * 2); ctx.fill();
}

// Padankan warna aksen kepada nama tint Airi supaya setiap kad ada gaya sendiri.
function accentKey(c) { const m = { [THEME.pink]: 'pink', [THEME.cyan]: 'cyan', [THEME.violet]: 'violet', [THEME.gold]: 'gold', [THEME.mint]: 'mint', [THEME.red]: 'red' }; return m[c]; }
function seedNum(s) { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; }
function base(w, h, accent = THEME.pink, seed = 'airi') {
    const c = createCanvas(w, h), ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#1d1250'); g.addColorStop(0.55, '#0f1f55'); g.addColorStop(1, '#071433');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    paintAiri(ctx, w, h, { alpha: 0.55, dark: 0.45, tint: TINTS[accentKey(accent)] || null, shift: ((seedNum(seed) % 3) - 1) * 0.04, zoom: 1.0 + (seedNum(seed) % 6) * 0.07, dy: (((seedNum(seed) >> 4) % 5) - 2) * 0.04 });
    paintLogo(ctx, w - 180, 8, 164);
    glow(ctx, w * 0.15, h * 0.08, 380, accent, 0.35); glow(ctx, w * 0.92, h * 0.96, 420, THEME.cyan, 0.22);
    const r = rng(hash(seed + w + h));
    for (let i = 0; i < 70; i++) sparkle(ctx, r() * w, r() * h, 1 + r() * 3.2, 0.12 + r() * 0.45);
    ctx.textBaseline = 'alphabetic';
    return { c, ctx };
}
function panel(ctx, x, y, w, h, r = 28, a = 0.08, stroke = 'rgba(255,255,255,0.16)') {
    rr(ctx, x, y, w, h, r); ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fill();
    ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke();
}
function txt(ctx, t, x, y, { px = 24, w = 'bold', c = '#fff', a = 'left', i = false, max } = {}) {
    let size = px;
    if (max) { size = fit(ctx, String(t), max, px, w); }
    ctx.font = fnt(w, size, i); ctx.fillStyle = c; ctx.textAlign = a; ctx.fillText(String(t), x, y);
}
function chip(ctx, t, cx, y, color, tc = '#0b1030', px = 22) {
    ctx.font = fnt('bold', px);
    const w = ctx.measureText(String(t)).width + 40, h = px + 20;
    rr(ctx, cx - w / 2, y, w, h, h / 2); ctx.fillStyle = color; ctx.fill();
    ctx.fillStyle = tc; ctx.textAlign = 'center'; ctx.fillText(String(t), cx, y + px + 4);
}
function bar(ctx, x, y, w, h, frac, color) {
    rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fill();
    rr(ctx, x, y, Math.max(h, w * Math.min(1, Math.max(0, frac))), h, h / 2); ctx.fillStyle = color; ctx.fill();
}
async function avatar(ctx, buf, cx, cy, r, ring) {
    if (ring) {
        ctx.save(); ctx.shadowColor = ring; ctx.shadowBlur = 30; ctx.strokeStyle = ring; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.arc(cx, cy, r + 6, 0, 7); ctx.stroke(); ctx.restore();
    }
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.clip();
    let ok = false;
    if (buf) { try { const img = await loadImage(buf); ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2); ok = true; } catch { /* guna lalai */ } }
    if (!ok) {
        const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
        g.addColorStop(0, THEME.pink); g.addColorStop(1, THEME.cyan);
        ctx.fillStyle = g; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath(); ctx.arc(cx, cy - r * 0.15, r * 0.32, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.62, r * 0.55, r * 0.38, 0, 0, 7); ctx.fill();
    }
    ctx.restore();
}
// Maskot Airi: kartun ceria (kepala sahaja), sengaja ringkas dan comel.
function mascot(ctx, cx, cy, s) {
    // Maskot lama dibuang. Kedudukan yang sama kini dipakai untuk logo Airi sahaja.
    paintLogo(ctx, cx - s, cy - s, s * 2);
}
function footer(ctx, w, h, text = "AIRI'S CORNER  •  CYBER OS") {
    txt(ctx, text, w / 2, h - 34, { px: 20, c: 'rgba(255,255,255,0.45)', a: 'center' });
}
const out = c => c.toBuffer('image/jpeg', 90);
import { dua } from './konteks.js';
const rmf = n => dua(n);

// ===================== KAD =====================

export async function welcomeCard({ name = 'Kawan Baru', group = "Airi's Corner", count, avatar: av }) {
    const { c, ctx } = base(720, 900, THEME.pink, 'welcome' + name);
    panel(ctx, 28, 28, 664, 844, 44, 0.06, 'rgba(255,122,200,0.55)');
    txt(ctx, 'SELAMAT DATANG KE', 360, 108, { px: 26, c: THEME.cyan, a: 'center' });
    txt(ctx, strip(group) || "Airi's Corner", 360, 190, { px: 76, a: 'center', max: 620 });
    await avatar(ctx, av, 360, 420, 130, THEME.pink);
    txt(ctx, strip(name).slice(0, 28) || 'Kawan Baru', 360, 628, { px: 56, a: 'center', max: 600 });
    if (count) chip(ctx, `AHLI KE-${count}`, 360, 652, THEME.cyan);
    panel(ctx, 48, 728, 470, 124, 24, 0.1);
    ['Taip .menu untuk tengok semua', 'Tuntut hadiah harian: .daily', 'Cuba .mancing, mana tahu dapat mitos!']
        .forEach((l, i) => txt(ctx, '• ' + l, 70, 768 + i * 36, { px: 22, w: 'normal', c: 'rgba(255,255,255,0.9)', max: 430 }));
    mascot(ctx, 600, 790, 74);
    return out(c);
}

export const ZONES = [
    ['AI & HIBURAN', THEME.cyan, ['.airi', '.roast @user', '.puji @user', '.teka_lagu']],
    ['EKONOMI', THEME.mint, ['.kerja', '.daily', '.pasaran', '.lelong_kontena']],
    ['KENDERAAN & HARTA', THEME.violet, ['.showroom', '.lumba', '.beli_rumah']],
    ['PANCING & KOLEKSI', THEME.cyan, ['.mancing', '.jala', '.album', '.gabung']],
    ['UNDERWORLD', THEME.red, ['.rompak @user', '.hackbank', '.heist', '.bounty']],
    ['GENG & SOSIAL', THEME.pink, ['.geng', '.profil', '.top', '.dendam']],
    ['KASINO & GAME', THEME.gold, ['.slot', '.coinflip', '.serang_boss', '.teka_nombor']],
    ['ACARA & MISI', THEME.mint, ['.misi', '.liga', '.musim', '.buletin_cyber']]
];
export async function menuCard({ name = 'Warga', wallet = 0, event = null } = {}) {
    const W = 720, rows = Math.ceil(ZONES.length / 2), H = 300 + rows * 178 + 90;
    const { c, ctx } = base(W, H, THEME.pink, 'menu');
    txt(ctx, "AIRI'S CORNER", 40, 96, { px: 60, max: 440 });
    txt(ctx, 'CYBER OS  •  PANEL UTAMA', 40, 140, { px: 24, c: THEME.cyan });
    mascot(ctx, 600, 100, 66);
    panel(ctx, 28, 176, 664, 84, 24, 0.1);
    txt(ctx, strip(name).slice(0, 20), 54, 228, { px: 30, max: 330 });
    txt(ctx, rmf(wallet), 666, 228, { px: 30, a: 'right', c: THEME.mint, max: 300 });
    if (event) chip(ctx, 'ACARA: ' + strip(event).slice(0, 28), 360, 272, THEME.gold, '#0b1030', 18);
    ZONES.forEach(([title, color, cmds], i) => {
        const x = 28 + (i % 2) * 340, y = 308 + Math.floor(i / 2) * 178;
        panel(ctx, x, y, 324, 164, 26, 0.08, color + '88');
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x + 36, y + 38, 20, 0, 7); ctx.fill();
        txt(ctx, String(i + 1), x + 36, y + 47, { px: 24, c: '#0b1030', a: 'center' });
        txt(ctx, title, x + 68, y + 46, { px: 22, max: 240 });
        [].concat(cmds).forEach((cm, k) => txt(ctx, cm, x + 24, y + 84 + k * 26, { px: 19, w: 'normal', c: 'rgba(255,255,255,0.85)', max: 280 }));
    });
    footer(ctx, W, H, 'Taip nama command, contoh: .mancing');
    return out(c);
}

export async function profileCard({ name, nick, tier, net, wallet, bank, black, vehicle, pet, stats = {}, geng, badges = [], avatar: av, rank }) {
    const W = 720, H = 1000;
    const { c, ctx } = base(W, H, THEME.violet, 'profil' + name);
    panel(ctx, 24, 24, 672, 952, 40, 0.05, 'rgba(167,139,250,0.5)');
    await avatar(ctx, av, 140, 160, 84, THEME.cyan);
    txt(ctx, strip(name).slice(0, 26) || 'Warga', 250, 140, { px: 44, max: 420 });
    if (nick) txt(ctx, `"${strip(nick)}"`, 250, 176, { px: 22, w: 'normal', i: true, c: 'rgba(255,255,255,0.7)', max: 420 });
    chip(ctx, tier?.name || 'Warga', 250 + 100, 192, THEME.pink, '#0b1030', 20);
    if (rank) txt(ctx, `#${rank} dalam kumpulan`, 660, 78, { px: 22, a: 'right', c: THEME.gold });
    panel(ctx, 48, 280, 624, 190, 28, 0.1);
    txt(ctx, 'JUMLAH ASET', 76, 326, { px: 20, c: 'rgba(255,255,255,0.6)' });
    txt(ctx, rmf(net), 76, 396, { px: 64, c: THEME.mint, max: 570 });
    bar(ctx, 76, 420, 568, 18, tier?.frac ?? 0, THEME.pink);
    txt(ctx, tier?.next ? `Seterusnya: ${tier.next}` : 'Tahap tertinggi!', 76, 462, { px: 18, w: 'normal', c: 'rgba(255,255,255,0.65)' });
    const tiles = [['TUNAI', rmf(wallet), THEME.mint], ['BANK', rmf(bank), THEME.cyan], ['DUIT GELAP', rmf(black), THEME.red],
        ['JENAYAH', String(stats.crimes_done || 0), THEME.gold], ['MASUK LOKAP', String(stats.times_jailed || 0), THEME.violet], ['IKAN DITANGKAP', String(stats.fish_caught || 0), THEME.cyan]];
    tiles.forEach(([k, v, col], i) => {
        const x = 48 + (i % 2) * 316, y = 500 + Math.floor(i / 2) * 104;
        panel(ctx, x, y, 308, 92, 22, 0.08, col + '66');
        txt(ctx, k, x + 22, y + 34, { px: 17, c: 'rgba(255,255,255,0.6)' });
        txt(ctx, v, x + 22, y + 72, { px: 30, c: col, max: 262 });
    });
    txt(ctx, 'Kenderaan: ' + strip(vehicle || 'Jalan Kaki'), 60, 836, { px: 22, w: 'normal', max: 600 });
    txt(ctx, 'Pet: ' + strip(pet || 'Tiada') + (geng ? `   |   Geng: ${strip(geng)}` : ''), 60, 872, { px: 22, w: 'normal', max: 600 });
    badges.slice(0, 4).forEach((b, i) => chip(ctx, strip(b).slice(0, 14), 130 + i * 150, 892, THEME.gold, '#0b1030', 16));
    footer(ctx, W, H, "KAD PROFIL  •  AIRI'S CORNER");
    return out(c);
}

export async function topCard({ title = 'PAPAN TERTINGGI', subtitle = '', rows = [], accent = THEME.gold }) {
    const W = 720, H = 250 + Math.max(1, rows.length) * 92 + 80;
    const { c, ctx } = base(W, H, accent, 'top' + title);
    txt(ctx, title, 40, 100, { px: 54, max: 520 });
    if (subtitle) txt(ctx, subtitle, 40, 144, { px: 22, w: 'normal', c: THEME.cyan, max: 540 });
    mascot(ctx, 610, 100, 58);
    const medal = ['#fbbf24', '#cbd5e1', '#f59e0b'];
    if (!rows.length) txt(ctx, 'Belum ada data. Jom mula main!', 360, 320, { px: 28, a: 'center', c: 'rgba(255,255,255,0.7)' });
    rows.forEach((r, i) => {
        const y = 186 + i * 92;
        panel(ctx, 28, y, 664, 80, 24, i < 3 ? 0.14 : 0.07, i < 3 ? medal[i] + '99' : undefined);
        ctx.fillStyle = i < 3 ? medal[i] : 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.arc(76, y + 40, 26, 0, 7); ctx.fill();
        txt(ctx, String(i + 1), 76, y + 50, { px: 28, c: '#0b1030', a: 'center' });
        txt(ctx, strip(r.name).slice(0, 22) || 'Warga', 122, y + 38, { px: 28, max: 330 });
        if (r.sub) txt(ctx, r.sub, 122, y + 66, { px: 17, w: 'normal', c: 'rgba(255,255,255,0.6)', max: 330 });
        txt(ctx, r.value, 664, y + 50, { px: 28, a: 'right', c: accent, max: 220 });
    });
    footer(ctx, W, H);
    return out(c);
}

export async function wantedCard({ name, bounty = 0, crimes = 0, avatar: av, reason = 'Tabiat suka rompak kawan-kawan' }) {
    const W = 720, H = 1000, c = createCanvas(W, H), ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#ecd9aa'); g.addColorStop(1, '#c9a96a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    paintAiri(ctx, W, H, { alpha: 0.35, dark: 0.25 });
    const r = rng(hash('wanted' + name));
    for (let i = 0; i < 160; i++) { ctx.fillStyle = `rgba(90,60,20,${0.03 + r() * 0.06})`; ctx.beginPath(); ctx.arc(r() * W, r() * H, 1 + r() * 4, 0, 7); ctx.fill(); }
    ctx.strokeStyle = '#4a2f12'; ctx.lineWidth = 10; rr(ctx, 26, 26, W - 52, H - 52, 20); ctx.stroke();
    ctx.lineWidth = 3; rr(ctx, 44, 44, W - 88, H - 88, 14); ctx.stroke();
    txt(ctx, 'DICARI', 360, 170, { px: 130, c: '#4a2f12', a: 'center' });
    txt(ctx, 'HIDUP-HIDUP SAHAJA, JANGAN KASAR', 360, 214, { px: 24, c: '#7a4f1d', a: 'center' });
    ctx.fillStyle = '#2a1a08'; ctx.fillRect(168, 244, 384, 384);
    ctx.save(); ctx.beginPath(); ctx.rect(172, 248, 376, 376); ctx.clip();
    await avatar(ctx, av, 360, 436, 200, null);
    ctx.fillStyle = 'rgba(150,100,40,0.38)'; ctx.fillRect(172, 248, 376, 376);
    ctx.restore();
    txt(ctx, strip(name).slice(0, 24).toUpperCase() || 'WARGA', 360, 700, { px: 60, c: '#4a2f12', a: 'center', max: 600 });
    txt(ctx, strip(reason).slice(0, 60), 360, 740, { px: 22, w: 'normal', i: true, c: '#5a3b16', a: 'center', max: 600 });
    txt(ctx, 'GANJARAN', 360, 800, { px: 26, c: '#7a4f1d', a: 'center' });
    txt(ctx, rmf(bounty), 360, 876, { px: 76, c: '#7f1d1d', a: 'center', max: 600 });
    txt(ctx, `Kes jenayah direkod: ${crimes}`, 360, 920, { px: 22, w: 'normal', c: '#5a3b16', a: 'center' });
    txt(ctx, "POLIS SIBER AIRI'S CORNER", 360, 956, { px: 18, c: '#7a4f1d', a: 'center' });
    return out(c);
}

export async function newsCard({ date = '', headline = 'Tiada berita hari ini', items = [], quote = '' }) {
    const W = 720, H = 1180, c = createCanvas(W, H), ctx = c.getContext('2d');
    ctx.fillStyle = '#f4ecd8'; ctx.fillRect(0, 0, W, H);
    paintAiri(ctx, W, H, { alpha: 0.18, dark: 0.0 });
    paintLogo(ctx, W - 170, 8, 150);
    const r = rng(hash('news' + date));
    for (let i = 0; i < 140; i++) { ctx.fillStyle = `rgba(80,60,30,${0.02 + r() * 0.05})`; ctx.fillRect(r() * W, r() * H, 1 + r() * 3, 1 + r() * 3); }
    ctx.strokeStyle = '#1f1b16'; ctx.lineWidth = 4; ctx.strokeRect(24, 24, W - 48, H - 48);
    txt(ctx, 'THE AIRI TIMES', 360, 120, { px: 74, c: '#1f1b16', a: 'center', max: 620 });
    ctx.fillRect(48, 140, W - 96, 3); ctx.fillStyle = '#1f1b16'; ctx.fillRect(48, 150, W - 96, 1);
    txt(ctx, `${date}   •   Edisi Siber Airi's Corner   •   Percuma`, 360, 184, { px: 18, w: 'normal', c: '#3b342a', a: 'center', max: 620 });
    ctx.font = fnt('bold', 46); let y = 262;
    for (const line of wrap(ctx, strip(headline).toUpperCase(), 620).slice(0, 4)) { txt(ctx, line, 48, y, { px: 46, c: '#1f1b16' }); y += 56; }
    ctx.fillStyle = '#1f1b16'; ctx.fillRect(48, y - 20, W - 96, 2); y += 24;
    txt(ctx, 'BERITA RINGKAS', 48, y, { px: 20, c: '#7f1d1d' }); y += 12;
    ctx.font = fnt('normal', 26);
    for (const it of items.slice(0, 6)) {
        const lines = wrap(ctx, strip(it), 600).slice(0, 3);
        lines.forEach((l, i) => txt(ctx, (i === 0 ? '■  ' : '    ') + l, 48, y + 38 + i * 32, { px: 26, w: 'normal', c: '#1f1b16' }));
        y += 38 + lines.length * 32 + 8;
        if (y > H - 250) break;
    }
    if (quote) {
        ctx.fillStyle = '#1f1b16'; ctx.fillRect(48, H - 214, W - 96, 2);
        ctx.font = fnt('normal', 24, true);
        wrap(ctx, '"' + strip(quote) + '"', 600).slice(0, 3).forEach((l, i) => txt(ctx, l, 360, H - 170 + i * 32, { px: 24, w: 'normal', i: true, c: '#3b342a', a: 'center' }));
        txt(ctx, '- Wartawan Cilik Airi', 360, H - 56, { px: 20, c: '#7f1d1d', a: 'center' });
    }
    return out(c);
}

/** Kad pengumuman umum: acara, lobi heist, laporan polis, maklumat geng, keputusan musim... */
export async function panelCard({ kicker = '', title = '', lines = [], accent = THEME.pink, big = '', bigLabel = '', footerText, avatar: av, tag }) {
    const W = 720;
    const tmp = createCanvas(W, 10).getContext('2d'); tmp.font = fnt('bold', 54);
    const tl = wrap(tmp, strip(title), 600).slice(0, 3);
    const H = 250 + tl.length * 64 + (big ? 190 : 0) + lines.length * 54 + (av ? 150 : 0) + 100;
    const { c, ctx } = base(W, H, accent, 'panel' + title);
    panel(ctx, 24, 24, W - 48, H - 48, 40, 0.05, accent + '99');
    if (kicker) chip(ctx, kicker, 200, 64, accent, '#0b1030', 22);
    if (tag) txt(ctx, tag, 680, 100, { px: 20, a: 'right', c: 'rgba(255,255,255,0.55)' });
    mascot(ctx, 610, 100, 50);
    let y = 190;
    tl.forEach(l => { txt(ctx, l, 52, y + 50, { px: 54, max: 560 }); y += 64; });
    y += 40;
    if (av !== undefined && av !== null) { await avatar(ctx, av, 360, y + 55, 55, accent); y += 150; }
    if (big) {
        panel(ctx, 52, y, W - 104, 150, 30, 0.12, accent);
        if (bigLabel) txt(ctx, bigLabel, 360, y + 40, { px: 20, a: 'center', c: 'rgba(255,255,255,0.65)' });
        txt(ctx, String(big), 360, y + 112, { px: 84, a: 'center', c: accent, max: 580 });
        y += 190;
    }
    for (const l of lines) {
        if (typeof l === 'string') txt(ctx, '• ' + strip(l), 56, y + 30, { px: 25, w: 'normal', c: 'rgba(255,255,255,0.92)', max: 610 });
        else { txt(ctx, l.k, 56, y + 30, { px: 22, w: 'normal', c: 'rgba(255,255,255,0.6)', max: 280 }); txt(ctx, String(l.v), 664, y + 30, { px: 26, a: 'right', c: l.c || '#fff', max: 330 }); }
        y += 54;
    }
    footer(ctx, W, H, footerText);
    return out(c);
}

/** Album koleksi: spesies yang belum dapat jadi siluet gelap. */
export async function albumCard({ title = 'ALBUM', species = [], accent = THEME.cyan, owned = 0, total = 0, page = 1, pages = 1, avatar = null }) {
    const W = 720, cols = 4, cw = 170, rh = 170;
    const rows = Math.max(1, Math.ceil(species.length / cols));
    const H = 270 + rows * rh + 90;
    const { c, ctx } = base(W, H, accent, 'album' + title);
    // Logo di kanan atas dilukis oleh base(). Teks & bar disusun di kiri supaya tak bertindih.
    if (avatar) {
        try {
            const gambar = await loadImage(avatar);
            ctx.save(); ctx.beginPath(); ctx.arc(64, 42, 30, 0, Math.PI * 2); ctx.clip();
            ctx.drawImage(gambar, 34, 12, 60, 60); ctx.restore();
            ctx.strokeStyle = accent; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(64, 42, 30, 0, Math.PI * 2); ctx.stroke();
        } catch { /* gambar profil rosak: teruskan */ }
    }
    txt(ctx, title, 40, 104, { px: 50, max: 440 });
    txt(ctx, `${owned} / ${total || species.length} dikumpul`, 40, 150, { px: 24, c: THEME.cyan, max: 440 });
    bar(ctx, 40, 168, 440, 14, (total || species.length) ? owned / (total || species.length) : 0, accent);
    txt(ctx, `Halaman ${page} / ${pages}`, 40, 210, { px: 22, c: '#ffffff', max: 440 });
    species.forEach((s, i) => {
        const x = 36 + (i % cols) * cw, y = 250 + Math.floor(i / cols) * rh;
        const col = (RARITY[s.rarity] || RARITY.biasa).color;
        panel(ctx, x + 4, y, cw - 8, 160, 18, s.owned ? 0.14 : 0.05, s.owned ? col + 'aa' : undefined);
        const t = createCanvas(150, 110), tc = t.getContext('2d');
        if (s.owned) {
            if (!lukisIkan(tc, s.rarity, s.nama, 75, 55, 100)) drawCreature(tc, 75, 55, 100, s.nama, s.rarity);
        } else if (!lukisIkan(tc, s.rarity, s.nama, 75, 55, 100, true)) {
            drawCreature(tc, 75, 55, 100, s.nama, s.rarity);
            tc.globalCompositeOperation = 'source-in'; tc.fillStyle = '#0a0f26'; tc.fillRect(0, 0, 150, 110);
        }
        ctx.drawImage(t, x + 10, y + 4, 150, 110);
        if (!s.owned) {
            txt(ctx, '???', x + cw / 2, y + 138, { px: 16, w: 'bold', a: 'center', c: 'rgba(255,255,255,0.4)', max: cw - 16 });
            return;
        }
        ctx.font = fnt('bold', 15);
        const lines = wrap(ctx, strip(s.nama), cw - 22).slice(0, 2);
        lines.forEach((ln, k) => txt(ctx, ln, x + cw / 2, y + 128 + k * 17, { px: 15, w: 'bold', a: 'center', c: '#fff', max: cw - 22 }));
    });
    footer(ctx, W, H, 'Tangkap lagi untuk lengkapkan album!');
    return out(c);
}

// KAD MENU: senarai command dalam gambar, ikut zon. Setiap halaman ada beberapa zon.
export function menuListCard({ page = 1, pages = 1, zones = [], name = 'Warga', wallet = '0', bank = '0', vehicle = 'Kaki' }) {
    const W = 720;
    const palet = [THEME.cyan, THEME.pink, THEME.gold, THEME.mint, THEME.violet];
    const heights = zones.map(z => 70 + Math.ceil(z.items.length / 2) * 48 + (z.note ? 34 : 0) + 18);
    const H = 250 + heights.reduce((a, b) => a + b, 0) + 90;
    const { c, ctx } = base(W, H, THEME.cyan, 'menu' + page);
    txt(ctx, "AIRI'S CORNER · MENU", 40, 80, { px: 46, max: 640 });
    txt(ctx, '@' + name, 40, 126, { px: 26, c: THEME.cyan, max: 420 });
    txt(ctx, `Tunai RM ${wallet}   ·   Bank RM ${bank}`, 40, 164, { px: 22, c: '#e2e8f0', max: 640 });
    txt(ctx, `Kenderaan: ${vehicle}`, 40, 196, { px: 22, c: '#e2e8f0', max: 640 });
    txt(ctx, `Halaman ${page} / ${pages}`, W - 40, 80, { px: 24, c: '#ffffff', a: 'right' });
    let y = 230;
    zones.forEach((z, zi) => {
        const accent = palet[(z.num - 1) % palet.length];
        txt(ctx, `${z.num}. ${z.title}`, 40, y + 36, { px: 28, w: 'bold', c: accent, max: 640 });
        z.items.forEach((it, i) => {
            const col = i % 2, row = Math.floor(i / 2);
            const x = 40 + col * 338, cy = y + 58 + row * 48;
            panel(ctx, x, cy, 318, 40, 12, 0.10, accent + '66');
            txt(ctx, it, x + 14, cy + 27, { px: 21, w: 'bold', c: '#ffffff', max: 290 });
        });
        if (z.note) txt(ctx, z.note, 40, y + 58 + Math.ceil(z.items.length / 2) * 48 + 26, { px: 18, c: '#94a3b8', max: 640 });
        y += heights[zi];
    });
    footer(ctx, W, H, 'Taip .menu ' + (page < pages ? page + 1 : 1) + ' untuk halaman seterusnya');
    return out(c);
}

// KAD TEKS: tukar teks panjang jadi gambar (latar Airi). Dipecahkan kepada beberapa halaman kalau panjang.
export function textCardPages(text, { maxLines = 34, width = 620 } = {}) {
    const probe = createCanvas(10, 10).getContext('2d');
    probe.font = fnt('normal', 24);
    const lines = [];
    for (const raw of String(text).split('\n')) {
        if (!raw.trim()) { lines.push(''); continue; }
        for (const w of wrap(probe, raw, width)) lines.push(w);
    }
    const chunks = [];
    for (let i = 0; i < lines.length; i += maxLines) chunks.push(lines.slice(i, i + maxLines));
    if (!chunks.length) chunks.push(['']);
    return chunks.map((chunk, pi) => {
        const W = 720, LH = 34;
        const H = 200 + chunk.length * LH + 90;
        const { c, ctx } = base(W, H, THEME.cyan, 'teks' + pi + text.length);
        let y = 150;
        chunk.forEach(ln => {
            if (ln) txt(ctx, ln, 50, y, { px: 24, w: 'normal', c: '#f1f5f9', max: width });
            y += LH;
        });
        if (chunks.length > 1) txt(ctx, `Halaman ${pi + 1} / ${chunks.length}`, W - 50, 120, { px: 22, c: THEME.cyan, a: 'right' });
        footer(ctx, W, H);
        return out(c);
    });
}

// PAPAN PANDUAN (menu gambar): tunjuk setiap bahagian bot, apa ia buat, dan command untuk ditaip.
export async function dashboardCard({ nama = 'Warga', tunai = '0', bank = '0', seksyen = [], avatar = null }) {
    const W = 720, rowH = 38;
    const H = 260 + seksyen.reduce((a, s) => a + 50 + s.baris.length * rowH + 20, 0) + 80;
    const { c, ctx } = base(W, H, THEME.cyan, 'dash' + Math.random());
    txt(ctx, "AIRI'S CORNER", 40, 78, { px: 46, max: 640 });
    txt(ctx, 'PANDUAN & MENU', 40, 124, { px: 26, c: THEME.cyan, max: 640 });
    txt(ctx, '@' + nama, 40, 166, { px: 24, c: '#ffffff', max: 640 });
    txt(ctx, `Tunai RM ${tunai}   ·   Bank RM ${bank}`, 40, 200, { px: 22, c: '#e2e8f0', max: 640 });
    if (avatar) {
        try {
            const gambar = await loadImage(avatar);
            ctx.save(); ctx.beginPath(); ctx.arc(W - 90, 230, 56, 0, Math.PI * 2); ctx.clip();
            ctx.drawImage(gambar, W - 146, 174, 112, 112); ctx.restore();
            ctx.strokeStyle = THEME.cyan; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(W - 90, 230, 56, 0, Math.PI * 2); ctx.stroke();
        } catch { /* gambar profil rosak: teruskan */ }
    }
    let y = 250;
    for (const s of seksyen) {
        txt(ctx, s.tajuk, 40, y + 30, { px: 28, w: 'bold', c: s.warna, max: 640 });
        y += 50;
        for (const [cmd, ket] of s.baris) {
            panel(ctx, 40, y, 640, 32, 10, 0.08, s.warna + '55');
            txt(ctx, cmd, 56, y + 23, { px: 20, w: 'bold', c: s.warna, max: 210 });
            txt(ctx, ket, 270, y + 23, { px: 19, c: '#e2e8f0', max: 400 });
            y += rowH;
        }
        y += 20;
    }
    footer(ctx, W, H, 'Taip nama command untuk guna. Contoh: .kerja');
    return out(c);
}
