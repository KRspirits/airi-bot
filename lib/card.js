import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// =========================================================================
// 🎴 AIRI CARD ENGINE
// Lukis kad gambar (720x1000, portrait, sesuai skrin WhatsApp) tanpa aset luar.
// Makhluk dilukis secara prosedural, seed daripada nama => spesies sama
// sentiasa nampak sama, tapi spesies berbeza nampak lain.
// NOTA: emoji TIDAK dilukis (Render Linux tiada emoji font), jadi kita strip.
// Letak fail .ttf/.otf dalam assets/fonts/ kalau nak font sendiri.
// =========================================================================

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const W = 720, H = 1000;

let FONT = 'sans-serif';
try {
    const dir = path.join(__dirname, '..', 'assets', 'fonts');
    if (fs.existsSync(dir)) {
        for (const f of fs.readdirSync(dir)) {
            if (/\.(ttf|otf)$/i.test(f) && GlobalFonts.registerFromPath(path.join(dir, f), 'AiriFont')) FONT = 'AiriFont';
        }
    }
} catch { /* guna sans-serif */ }

const RARITY = {
    sampah: { label: 'SAMPAH', color: '#94a3b8', bg: ['#0d1117', '#1c2128'], stars: 25 },
    biasa:  { label: 'BIASA',  color: '#38bdf8', bg: ['#04121f', '#0b2a45'], stars: 45 },
    rare:   { label: 'RARE',   color: '#c084fc', bg: ['#12062b', '#2e1065'], stars: 80 },
    mitos:  { label: 'MITOS',  color: '#fbbf24', bg: ['#1f0600', '#5a1a00'], stars: 140 }
};

const FLAVOR = {
    sampah: [
        'Ini bukan ikan. Ini keputusan hidup kau.',
        'Ahlong pun tak nak benda ni.',
        'Dipercayai milik arwah WiFi rumah sewa.',
        'Bau dia boleh didakwa di mahkamah.'
    ],
    biasa: [
        'Ikan ni nampak macam tahu kau belum bayar hutang.',
        'Digoreng pun masih menilai kau.',
        'Ditangkap di kawasan yang tak wujud dalam peta.',
        'Dia pun terkejut kena pancing.'
    ],
    rare: [
        'Dikatakan pernah berunding dengan ahlong dan menang.',
        'Sisiknya mengira cukai pendapatan kau.',
        'Saksi kejadian tiga kes rompak, tak pernah bersuara.',
        'Pakar tak percaya, tokey pajak pun tak percaya.'
    ],
    mitos: [
        'Kewujudannya menyalahi hukum fizik dan hukum jenayah.',
        'Kata orang, tengok mata dia sekali, line terus penuh.',
        'Sejarah tulis nama kau huruf kecil. Dia huruf emas.',
        'Dijaga oleh arus yang tak pernah bayar sewa.'
    ]
};

// ---------- helpers ----------
const strip = s => String(s || '').replace(/[\p{Extended_Pictographic}\u200d\ufe0f]/gu, '').replace(/\s+/g, ' ').trim();
const fnt = (w, px, italic = false) => `${italic ? 'italic ' : ''}${w} ${px}px ${FONT}, sans-serif`;

function hash(s) {
    let h = 1779033703 ^ s.length;
    for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    return h >>> 0;
}
function rng(seed) {
    let a = seed;
    return () => {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}
function fit(ctx, text, maxW, startPx, weight = 'bold') {
    let px = startPx;
    do { ctx.font = fnt(weight, px); if (ctx.measureText(text).width <= maxW) break; px -= 2; } while (px > 20);
    return px;
}
function wrap(ctx, text, maxW) {
    const lines = []; let cur = '';
    for (const w of text.split(' ')) {
        const t = cur ? cur + ' ' + w : w;
        if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
    }
    if (cur) lines.push(cur);
    return lines;
}
function palette(r, rarity) {
    const h = Math.floor(r() * 360), h2 = (h + 30 + r() * 80) % 360;
    const sat = rarity === 'sampah' ? 8 : 65 + r() * 25;
    return {
        a: `hsl(${h}, ${sat}%, 55%)`, b: `hsl(${h2}, ${sat}%, 38%)`,
        belly: `hsl(${h}, ${sat * 0.6}%, 80%)`, fin: `hsl(${h2}, ${sat}%, 62%)`
    };
}
function pickKind(name) {
    const n = name.toLowerCase();
    if (/sotong|kraken|cumi|kurita|ubur/.test(n)) return 'squid';
    if (/ketam|lobster|udang|krab/.test(n)) return 'crab';
    if (/penyu|kura/.test(n)) return 'turtle';
    return 'fish';
}

// ---------- bahagian makhluk ----------
function eye(ctx, x, y, rad, rarity) {
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill();
    ctx.fillStyle = rarity === 'mitos' ? '#ef4444' : '#111'; ctx.beginPath(); ctx.arc(x + rad * 0.2, y, rad * 0.55, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + rad * 0.35, y - rad * 0.25, rad * 0.2, 0, 7); ctx.fill();
}
function horns(ctx, x, y, s, col) {
    ctx.fillStyle = col;
    for (const d of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(x + d * s * 0.03, y); ctx.lineTo(x + d * s * 0.1, y - s * 0.22); ctx.lineTo(x + d * s * 0.13, y + s * 0.01); ctx.fill();
    }
}
function crown(ctx, x, y, s) {
    ctx.fillStyle = '#fde047'; ctx.strokeStyle = '#a16207'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - s * .1, y); ctx.lineTo(x - s * .1, y - s * .1); ctx.lineTo(x - s * .05, y - s * .04);
    ctx.lineTo(x, y - s * .12); ctx.lineTo(x + s * .05, y - s * .04); ctx.lineTo(x + s * .1, y - s * .1);
    ctx.lineTo(x + s * .1, y); ctx.closePath(); ctx.fill(); ctx.stroke();
}
function bodyGrad(ctx, cx, cy, ry, p) {
    const g = ctx.createLinearGradient(cx, cy - ry, cx, cy + ry);
    g.addColorStop(0, p.a); g.addColorStop(0.7, p.b); g.addColorStop(1, p.belly);
    return g;
}

function drawFish(ctx, cx, cy, s, r, p, rarity) {
    const rx = s * 0.48, ry = s * 0.26 * (0.85 + r() * 0.5);
    ctx.fillStyle = p.fin;
    ctx.beginPath(); // ekor
    ctx.moveTo(cx - rx * 0.8, cy);
    ctx.quadraticCurveTo(cx - rx - s * 0.1, cy - ry * 1.4, cx - rx - s * 0.3, cy - ry * 1.2);
    ctx.quadraticCurveTo(cx - rx - s * 0.12, cy, cx - rx - s * 0.3, cy + ry * 1.2);
    ctx.quadraticCurveTo(cx - rx - s * 0.1, cy + ry * 1.4, cx - rx * 0.8, cy);
    ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx - rx * 0.4, cy - ry * 0.85); ctx.quadraticCurveTo(cx, cy - ry * 2.0, cx + rx * 0.35, cy - ry * 0.9); ctx.fill(); // sirip atas
    ctx.beginPath(); ctx.moveTo(cx, cy + ry * 0.85); ctx.quadraticCurveTo(cx - rx * 0.1, cy + ry * 1.7, cx + rx * 0.3, cy + ry * 0.95); ctx.fill(); // sirip bawah
    ctx.fillStyle = bodyGrad(ctx, cx, cy, ry, p);
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.clip();
    const pat = Math.floor(r() * 3);
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 3;
    if (pat === 0) {
        for (let x = cx - rx * 0.6; x < cx + rx * 0.5; x += s * 0.08) { ctx.beginPath(); ctx.moveTo(x, cy - ry); ctx.lineTo(x - s * 0.05, cy + ry); ctx.stroke(); }
    } else if (pat === 1) {
        let row = 0;
        for (let y = cy - ry * 0.7; y < cy + ry * 0.8; y += s * 0.07, row++)
            for (let x = cx - rx * 0.7; x < cx + rx * 0.5; x += s * 0.09) { ctx.beginPath(); ctx.arc(x + (row % 2 ? s * 0.045 : 0), y, s * 0.04, 0, Math.PI); ctx.stroke(); }
    } else {
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(cx - rx * 0.6 + r() * rx * 1.1, cy - ry * 0.6 + r() * ry * 1.2, s * (0.015 + r() * 0.03), 0, 7); ctx.fill(); }
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(cx + rx * 0.3, cy, ry * 0.8, Math.PI * 0.6, Math.PI * 1.4, true); ctx.stroke();
    eye(ctx, cx + rx * 0.6, cy - ry * 0.2, s * 0.07, rarity);
    if (rarity === 'mitos') { eye(ctx, cx + rx * 0.35, cy - ry * 0.45, s * 0.04, rarity); horns(ctx, cx + rx * 0.45, cy - ry * 0.85, s, p.fin); }
    if (rarity === 'rare' && r() < 0.5) horns(ctx, cx + rx * 0.45, cy - ry * 0.85, s * 0.7, p.fin);
    ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(cx + rx * 0.92, cy + ry * 0.25, s * 0.05, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke();
    if (rarity === 'mitos' && r() < 0.6) crown(ctx, cx + rx * 0.45, cy - ry * 0.95, s);
}

function drawSquid(ctx, cx, cy, s, r, p, rarity) {
    ctx.strokeStyle = p.fin; ctx.lineCap = 'round'; ctx.lineWidth = s * 0.045;
    for (let i = 0; i < 8; i++) {
        const x0 = cx - s * 0.22 + i * s * 0.063;
        ctx.beginPath(); ctx.moveTo(x0, cy + s * 0.05);
        ctx.bezierCurveTo(x0 + (r() - 0.5) * s * 0.3, cy + s * 0.2, x0 + (r() - 0.5) * s * 0.3, cy + s * 0.32, x0 + (r() - 0.5) * s * 0.25, cy + s * 0.46);
        ctx.stroke();
    }
    ctx.fillStyle = bodyGrad(ctx, cx, cy - s * 0.2, s * 0.34, p);
    ctx.beginPath(); ctx.ellipse(cx, cy - s * 0.2, s * 0.2, s * 0.34, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, cy + s * 0.02, s * 0.27, s * 0.17, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.arc(cx + (r() - 0.5) * s * 0.28, cy - s * 0.1 - r() * s * 0.35, s * (0.012 + r() * 0.02), 0, 7); ctx.fill(); }
    eye(ctx, cx - s * 0.12, cy, s * 0.065, rarity); eye(ctx, cx + s * 0.12, cy, s * 0.065, rarity);
    if (rarity === 'mitos') crown(ctx, cx, cy - s * 0.5, s);
}

function drawCrab(ctx, cx, cy, s, r, p, rarity) {
    ctx.strokeStyle = p.fin; ctx.lineCap = 'round'; ctx.lineWidth = s * 0.035;
    for (const d of [-1, 1]) {
        for (let i = 0; i < 3; i++) {
            const y = cy + s * 0.02 + i * s * 0.07;
            ctx.beginPath(); ctx.moveTo(cx + d * s * 0.25, y); ctx.lineTo(cx + d * s * 0.42, y + s * 0.06); ctx.lineTo(cx + d * s * 0.5, y + s * 0.18); ctx.stroke();
        }
        ctx.beginPath(); ctx.moveTo(cx + d * s * 0.25, cy - s * 0.08); ctx.lineTo(cx + d * s * 0.4, cy - s * 0.22); ctx.stroke(); // lengan
        ctx.fillStyle = p.fin; ctx.beginPath(); ctx.arc(cx + d * s * 0.43, cy - s * 0.3, s * 0.12, 0, 7); ctx.fill(); // sepit
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.moveTo(cx + d * s * 0.43, cy - s * 0.3); ctx.lineTo(cx + d * s * 0.37, cy - s * 0.42); ctx.lineTo(cx + d * s * 0.5, cy - s * 0.4); ctx.fill();
    }
    ctx.fillStyle = bodyGrad(ctx, cx, cy, s * 0.22, p);
    ctx.beginPath(); ctx.ellipse(cx, cy + s * 0.05, s * 0.3, s * 0.22, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = p.b; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx - s * 0.08, cy - s * 0.12); ctx.lineTo(cx - s * 0.08, cy - s * 0.18); ctx.moveTo(cx + s * 0.08, cy - s * 0.12); ctx.lineTo(cx + s * 0.08, cy - s * 0.18); ctx.stroke();
    eye(ctx, cx - s * 0.08, cy - s * 0.2, s * 0.05, rarity); eye(ctx, cx + s * 0.08, cy - s * 0.2, s * 0.05, rarity);
    if (rarity === 'mitos') crown(ctx, cx, cy - s * 0.25, s);
}

function drawTurtle(ctx, cx, cy, s, r, p, rarity) {
    ctx.fillStyle = p.fin;
    for (const [dx, dy] of [[-0.3, -0.22], [0.25, -0.22], [-0.3, 0.22], [0.25, 0.22]]) { ctx.beginPath(); ctx.ellipse(cx + dx * s, cy + dy * s, s * 0.14, s * 0.07, dy < 0 ? -0.5 : 0.5, 0, 7); ctx.fill(); }
    ctx.beginPath(); ctx.arc(cx + s * 0.42, cy, s * 0.1, 0, 7); ctx.fill();
    eye(ctx, cx + s * 0.45, cy - s * 0.02, s * 0.03, rarity);
    ctx.fillStyle = bodyGrad(ctx, cx, cy, s * 0.3, p);
    ctx.beginPath(); ctx.ellipse(cx, cy, s * 0.38, s * 0.3, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(cx, cy, s * 0.22, s * 0.16, 0, 0, 7); ctx.stroke();
    for (let a = 0; a < 6; a++) { const t = a * Math.PI / 3 + 0.5; ctx.beginPath(); ctx.moveTo(cx + Math.cos(t) * s * 0.22, cy + Math.sin(t) * s * 0.16); ctx.lineTo(cx + Math.cos(t) * s * 0.38, cy + Math.sin(t) * s * 0.3); ctx.stroke(); }
    if (rarity === 'mitos') crown(ctx, cx, cy - s * 0.28, s);
}

function drawJunk(ctx, cx, cy, s, r) {
    ctx.fillStyle = '#6b7280'; ctx.beginPath();
    const n = 12;
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, rad = s * (0.22 + r() * 0.14); const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#111'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    for (const d of [-1, 1]) { const x = cx + d * s * 0.09, y = cy - s * 0.04; ctx.beginPath(); ctx.moveTo(x - 12, y - 12); ctx.lineTo(x + 12, y + 12); ctx.moveTo(x + 12, y - 12); ctx.lineTo(x - 12, y + 12); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(cx, cy + s * 0.14, s * 0.06, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    ctx.strokeStyle = 'rgba(132,204,22,0.7)'; ctx.lineWidth = 5;
    for (const dx of [-0.15, 0, 0.15]) { ctx.beginPath(); ctx.moveTo(cx + dx * s, cy - s * 0.3); ctx.bezierCurveTo(cx + dx * s + 20, cy - s * 0.38, cx + dx * s - 20, cy - s * 0.44, cx + dx * s, cy - s * 0.52); ctx.stroke(); }
}

function drawAura(ctx, cx, cy, rad, color, rarity, r) {
    const g = ctx.createRadialGradient(cx, cy, rad * 0.2, cx, cy, rad);
    g.addColorStop(0, color + '66'); g.addColorStop(1, color + '00');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, 7); ctx.fill();
    if (rarity === 'mitos' || rarity === 'rare') {
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = 0.5;
        const rings = rarity === 'mitos' ? 3 : 1;
        for (let i = 0; i < rings; i++) { ctx.setLineDash([10 + i * 6, 14]); ctx.beginPath(); ctx.arc(cx, cy, rad * (0.7 + i * 0.12), 0, 7); ctx.stroke(); }
        ctx.setLineDash([]);
        if (rarity === 'mitos') {
            for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * rad * 0.62, cy + Math.sin(a) * rad * 0.62); ctx.lineTo(cx + Math.cos(a) * rad * (0.8 + r() * 0.3), cy + Math.sin(a) * rad * (0.8 + r() * 0.3)); ctx.stroke(); }
        }
        ctx.globalAlpha = 1;
    }
}

// ---------- kad penuh ----------
/**
 * @param {{nama:string, rarity?:'sampah'|'biasa'|'rare'|'mitos', harga?:number, buff?:string, owner?:string, serial?:number, kind?:string}} o
 * @returns {Buffer} JPEG siap hantar guna sock.sendMessage(jid, { image: buf })
 */
export function renderCatchCard(o) {
    const R = RARITY[o.rarity] || RARITY.biasa;
    const rarity = RARITY[o.rarity] ? o.rarity : 'biasa';
    const name = strip(o.nama) || 'Misteri';
    const serial = o.serial ?? (Date.now() % 100000);
    const r = rng(hash(name + '|v1'));                    // rupa spesies (tetap)
    const rc = rng(hash(name + '|' + serial));            // ciri tangkapan ini (berubah)
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // latar
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, R.bg[0]); bg.addColorStop(1, R.bg[1]);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < R.stars; i++) {
        ctx.fillStyle = `rgba(255,255,255,${0.1 + rc() * 0.5})`;
        ctx.beginPath(); ctx.arc(rc() * W, rc() * H, 0.6 + rc() * 2, 0, 7); ctx.fill();
    }

    // bingkai
    ctx.save();
    let stroke = R.color;
    if (rarity === 'mitos') {
        const rg = ctx.createLinearGradient(0, 0, W, H);
        ['#ef4444', '#f59e0b', '#fde047', '#22c55e', '#38bdf8', '#a855f7', '#ef4444'].forEach((c, i, a) => rg.addColorStop(i / (a.length - 1), c));
        stroke = rg;
    }
    ctx.shadowColor = R.color; ctx.shadowBlur = rarity === 'mitos' ? 40 : rarity === 'rare' ? 25 : 12;
    ctx.strokeStyle = stroke; ctx.lineWidth = rarity === 'mitos' ? 10 : 6;
    rr(ctx, 18, 18, W - 36, H - 36, 36); ctx.stroke();
    ctx.restore();

    // header
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = fnt('bold', 22); ctx.textAlign = 'left';
    ctx.fillText('AIRI CYBER OS', 56, 78);
    ctx.textAlign = 'right'; ctx.fillText('#' + String(serial).padStart(5, '0'), W - 56, 78);

    ctx.textAlign = 'center';
    ctx.fillStyle = R.color; rr(ctx, W / 2 - 110, 100, 220, 50, 25); ctx.fill();
    ctx.fillStyle = '#0b0b0b'; ctx.font = fnt('bold', 28); ctx.fillText(R.label, W / 2, 136);

    ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.font = fnt('normal', 22);
    ctx.fillText('Ditangkap oleh ' + (strip(o.owner) || 'Warga Gelap').slice(0, 24), W / 2, 185);

    // makhluk
    const cx = W / 2, cy = 430;
    drawAura(ctx, cx, cy, 250, R.color.length === 7 ? R.color : '#ffffff', rarity, rc);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(cx, cy, 215, 0, 7); ctx.fill();
    ctx.strokeStyle = R.color; ctx.lineWidth = 3; ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.arc(cx, cy, 215, 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
    const p = palette(r, rarity);
    const kind = rarity === 'sampah' ? 'junk' : (o.kind || pickKind(name));
    const size = 390;
    ctx.lineCap = 'round';
    ({ junk: drawJunk, squid: drawSquid, crab: drawCrab, turtle: drawTurtle, fish: drawFish }[kind] || drawFish)(ctx, cx, cy, size, r, p, rarity);

    // nama
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
    fit(ctx, name, W - 120, 56); ctx.fillText(name, cx, 725);

    // flavor
    const pool = FLAVOR[rarity];
    const flavor = pool[Math.floor(rc() * pool.length)];
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = fnt('normal', 24, true);
    wrap(ctx, '"' + flavor + '"', W - 140).slice(0, 2).forEach((l, i) => ctx.fillText(l, cx, 772 + i * 30));

    // statistik tak masuk akal
    const scale = { sampah: 1, biasa: 3, rare: 40, mitos: 900 }[rarity];
    const berat = (scale * (0.5 + rc())).toFixed(1);
    const panjang = Math.round((20 + scale * 2) * (0.6 + rc()));
    const marah = Math.floor(rc() * 101);
    const rows = [
        ['BERAT', `${Number(berat).toLocaleString('en-US')} kg`, Math.min(1, 0.2 + rc() * 0.8)],
        ['PANJANG', `${panjang.toLocaleString('en-US')} cm`, Math.min(1, 0.2 + rc() * 0.8)],
        ['KEMARAHAN', `${marah}%`, marah / 100]
    ];
    rows.forEach(([lab, val, frac], i) => {
        const y = 850 + i * 38;
        ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = fnt('bold', 20); ctx.fillText(lab, 60, y);
        ctx.fillStyle = 'rgba(255,255,255,0.12)'; rr(ctx, 215, y - 18, 280, 16, 8); ctx.fill();
        ctx.fillStyle = R.color; rr(ctx, 215, y - 18, Math.max(16, 280 * frac), 16, 8); ctx.fill();
        ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.font = fnt('bold', 20); ctx.fillText(val, W - 60, y);
    });

    // harga & buff
    ctx.textAlign = 'center';
    ctx.fillStyle = '#4ade80'; ctx.font = fnt('bold', 34);
    ctx.fillText('RM ' + Number(o.harga || 0).toLocaleString('en-US'), cx, 962);
    const buff = o.buff && o.buff !== 'Tiada' ? strip(o.buff) : '';
    if (buff) { ctx.fillStyle = R.color; ctx.font = fnt('bold', 20); ctx.fillText('BUFF: ' + buff, cx, 988); }

    return canvas.toBuffer('image/jpeg', 90);
}


// ---------- eksport kongsi untuk lib/cards.js ----------
export { strip, fnt, rr, fit, wrap, hash, rng, RARITY, FLAVOR };
/** Lukis makhluk spesies `nama` (rupa tetap ikut nama) pada ctx sedia ada. */
export function drawCreature(ctx, cx, cy, size, nama, rarity = 'biasa', kind) {
    const name = strip(nama) || 'Misteri';
    const r = rng(hash(name + '|v1'));
    const p = palette(r, rarity);
    const k = rarity === 'sampah' ? 'junk' : (kind || pickKind(name));
    ctx.lineCap = 'round';
    ({ junk: drawJunk, squid: drawSquid, crab: drawCrab, turtle: drawTurtle, fish: drawFish }[k] || drawFish)(ctx, cx, cy, size, r, p, rarity);
}
