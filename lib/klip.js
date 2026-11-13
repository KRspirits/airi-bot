import { createCanvas } from '@napi-rs/canvas';
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { BANDAR, tukar, lukisLatar } from './peta.js';
import * as store from './store.js';

const HAD_HARIAN = 200; // had klip baharu sehari (kawal kos dan RAM)
const WARNA_BUAH = { durian: '#4d7c0f', anggur: '#7e22ce', epal: '#dc2626', oren: '#f97316', mangga: '#facc15', rambutan: '#dc2626', nanas: '#eab308', pisang: '#fde047', betik: '#fb923c', strawberi: '#e11d48', limau: '#84cc16', cili: '#dc2626', kangkung: '#16a34a' };

// =========================================================================
// 🎬 KLIP PENDEK. Semua klip 5 saat, 12 frame sesaat, 480x480, dilukis dalam bot dan dikodkan ffmpeg.
// Jenis: 'rider' (penghantaran), 'crypto' (candle), 'jackpot' (syiling), 'polis' (kereta polis).
// Satu klip dirender pada satu masa. Klip sama dicache 30 minit. Gagal = null, tiada ralat kepada pemain.
// =========================================================================

const W = 480, H = 480, FPS = 12, SAAT = 5;
const JUMLAH = FPS * SAAT;
const CACHE_MS = 30 * 60e3, CACHE_MAX = 30;
const cache = new Map();
let giliran = Promise.resolve();
const rp = n => `RM ${Math.round(Number(n) || 0).toLocaleString('en-US')}`;

// ---------- rider ----------
function pin(ctx, x, y, warna, skala = 1) {
    ctx.fillStyle = warna;
    ctx.beginPath(); ctx.arc(x, y, 12 * skala, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; ctx.stroke();
}
function kereta(ctx, x, y, sudut) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(sudut);
    const cahaya = ctx.createRadialGradient(10, 0, 2, 10, 0, 26);
    cahaya.addColorStop(0, 'rgba(254,249,195,0.95)'); cahaya.addColorStop(1, 'rgba(254,249,195,0)');
    ctx.fillStyle = cahaya; ctx.fillRect(-10, -26, 60, 52);
    ctx.fillStyle = '#e11d48'; ctx.fillRect(-14, -9, 28, 18);
    ctx.fillStyle = '#0f172a'; ctx.fillRect(-6, -7, 12, 14);
    ctx.fillStyle = '#fef9c3'; ctx.fillRect(12, -7, 3, 5); ctx.fillRect(12, 2, 3, 5);
    ctx.restore();
}
function bingkaiRider(ctx, t, { dari, ke, bayar }) {
    lukisLatar(ctx, W, H);
    const [xa, ya] = tukar(...BANDAR[dari], W, H), [xb, yb] = tukar(...BANDAR[ke], W, H);
    ctx.setLineDash([10, 8]); ctx.strokeStyle = 'rgba(34,211,238,0.6)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(xb, yb); ctx.stroke(); ctx.setLineDash([]);
    const p = Math.min(1, t / 0.85);
    const x = xa + (xb - xa) * p, y = ya + (yb - ya) * p;
    ctx.strokeStyle = 'rgba(250,204,21,0.85)'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(x, y); ctx.stroke();
    pin(ctx, xa, ya, '#fb923c');
    const sampai = t >= 0.85;
    pin(ctx, xb, yb, '#22d3ee', sampai ? 1 + 0.2 * Math.sin((t - 0.85) * 40) : 1);
    kereta(ctx, x, y, Math.atan2(yb - ya, xb - xa));
    if (sampai) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, H - 90, W, 90);
        ctx.fillStyle = '#fde68a'; ctx.font = 'bold 36px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(`SAMPAI! ${rp(bayar)}`, W / 2, H - 36); ctx.textAlign = 'left';
    }
}

// ---------- crypto ----------
// Candle sedia ada ditunjuk tetap. Hanya candle terakhir bergerak dari harga buka ke harga semasa.
function bingkaiCrypto(ctx, t, { candles, harga, aset }) {
    ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, W, H);
    const lilin = (candles || []).slice(-20);
    if (!lilin.length) return;
    ctx.fillStyle = '#00e5ff'; ctx.font = 'bold 28px sans-serif';
    ctx.fillText(aset === 'emas' ? 'EMAS · 5 MINIT' : 'BTC · 5 MINIT', 24, 46);
    ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(rp(harga), W - 24, 46); ctx.textAlign = 'left';

    const n = lilin.length, akhir = lilin[n - 1];
    const pad = { l: 24, r: 24, t: 90, b: 110 };
    const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
    const hi = Math.max(...lilin.map(k => k.h)), lo = Math.min(...lilin.map(k => k.l));
    const span = (hi - lo) || 1;
    const y = v => pad.t + ph * (1 - (v - lo) / span);
    const cw = pw / n;

    // progres pergerakan candle terakhir: 0 hingga 1 (mula selepas 20% masa)
    const p = Math.max(0, Math.min(1, (t - 0.2) / 0.8));
    const ease = p * p * (3 - 2 * p);
    const tutupSemasa = akhir.o + (akhir.c - akhir.o) * ease;

    lilin.forEach((k, i) => {
        const x = pad.l + i * cw + cw / 2;
        const isAkhir = i === n - 1;
        const tutup = isAkhir ? tutupSemasa : k.c;
        const naik = tutup >= k.o, warna = naik ? '#22c55e' : '#ef4444';
        ctx.strokeStyle = warna; ctx.fillStyle = warna; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, y(k.h)); ctx.lineTo(x, y(k.l)); ctx.stroke();
        const atas = y(Math.max(k.o, tutup)), bawah = y(Math.min(k.o, tutup));
        ctx.fillRect(x - cw * 0.3, atas, cw * 0.6, Math.max(2, bawah - atas));
    });

    // tulisan arah hanya bila candle terakhir hampir siap
    if (p >= 0.85 && akhir.o) {
        const beza = akhir.c - akhir.o, peratus = (beza / akhir.o) * 100;
        const naik = beza >= 0;
        ctx.fillStyle = naik ? '#22c55e' : '#ef4444'; ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(`${naik ? 'NAIK' : 'TURUN'} ${naik ? '+' : ''}${peratus.toFixed(2)}%`, W / 2, H - 40);
        ctx.textAlign = 'left';
    }
}

// ---------- jackpot ----------
function bingkaiJackpot(ctx, t, { pengganda }) {
    const latar = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * 0.7);
    latar.addColorStop(0, '#2a1a02'); latar.addColorStop(1, '#0a0700');
    ctx.fillStyle = latar; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 28; i++) {
        const seed = (i * 9301 + 49297) % 233280;
        const x = (seed % W), speed = 90 + (seed % 120);
        const y = ((seed * 7) % H + t * speed * SAAT) % (H + 40) - 20;
        ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(x, y, 9 + (i % 3) * 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fef9c3'; ctx.beginPath(); ctx.arc(x - 3, y - 3, 3, 0, Math.PI * 2); ctx.fill();
    }
    const kelip = Math.sin(t * Math.PI * 10) > 0;
    ctx.fillStyle = kelip ? '#fde68a' : '#f59e0b';
    ctx.font = 'bold 74px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('JACKPOT', W / 2, 220);
    ctx.fillStyle = '#fff7ed'; ctx.font = 'bold 34px sans-serif';
    ctx.fillText(`MENANG ${Math.round(pengganda)}x!`, W / 2, 280);
    ctx.textAlign = 'left';
}

// ---------- polis ----------
function bingkaiPolis(ctx, t) {
    const langit = ctx.createLinearGradient(0, 0, 0, H);
    langit.addColorStop(0, '#060912'); langit.addColorStop(1, '#16204a');
    ctx.fillStyle = langit; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#0b1020';
    ctx.fillRect(0, 330, W, 150);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for (let x = 0; x < W; x += 60) ctx.fillRect(((x - t * 300) % W + W) % W, 400, 30, 6);
    const x = -180 + t * (W + 360), yb = 330;
    const merah = Math.floor(t * 24) % 2 === 0;
    ctx.fillStyle = merah ? 'rgba(239,68,68,0.9)' : 'rgba(59,130,246,0.9)';
    ctx.beginPath(); ctx.arc(x + 120, yb - 60, 110, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f8fafc'; ctx.fillRect(x, yb - 50, 240, 70);
    ctx.fillStyle = '#e2e8f0'; ctx.fillRect(x + 60, yb - 95, 120, 50);
    ctx.fillStyle = '#1e293b'; ctx.fillRect(x + 75, yb - 84, 40, 28); ctx.fillRect(x + 125, yb - 84, 40, 28);
    ctx.fillStyle = merah ? '#ef4444' : '#3b82f6'; ctx.fillRect(x + 80, yb - 104, 40, 10);
    ctx.fillStyle = merah ? '#3b82f6' : '#ef4444'; ctx.fillRect(x + 120, yb - 104, 40, 10);
    for (const rx of [x + 50, x + 190]) { ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(rx, yb + 28, 26, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#ef4444'; ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('KANTOI!', W / 2, 90); ctx.textAlign = 'left';
}

// ---------- buah masak ----------
function bingkaiBuah(ctx, t, { crop, nadir }) {
    const latar = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * 0.7);
    latar.addColorStop(0, '#1e293b'); latar.addColorStop(1, '#020617');
    ctx.fillStyle = latar; ctx.fillRect(0, 0, W, H);
    const y = -60 + t * 360, x = W / 2 + Math.sin(t * Math.PI * 2) * 30;
    ctx.fillStyle = WARNA_BUAH[crop] || '#94a3b8';
    ctx.beginPath(); ctx.arc(x, y, 70, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(x - 22, y - 22, 18, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + t * 6;
        ctx.fillStyle = `rgba(253,230,138,${0.4 + 0.6 * Math.abs(Math.sin(t * 20 + i))})`;
        ctx.beginPath(); ctx.arc(x + Math.cos(a) * 110, y + Math.sin(a) * 110, 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = nadir === 'Legenda' ? '#fbbf24' : '#c084fc';
    ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(nadir.toUpperCase(), W / 2, H - 40); ctx.textAlign = 'left';
}

// ---------- lelongan ----------
function bingkaiLelong(ctx, t, { tapak }) {
    ctx.fillStyle = '#1c1917'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#78350f'; ctx.fillRect(60, 320, 360, 40);
    const tukul = Math.abs(Math.sin(t * Math.PI * 6));
    ctx.save(); ctx.translate(240, 150); ctx.rotate(-0.8 + tukul * 0.8);
    ctx.fillStyle = '#a8a29e'; ctx.fillRect(-10, 0, 20, 170);
    ctx.fillStyle = '#d6d3d1'; ctx.fillRect(-50, -20, 100, 40); ctx.restore();
    const naik = tapak * (1 + t * 0.6);
    ctx.fillStyle = '#fde68a'; ctx.font = 'bold 44px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(rp(naik), W / 2, 70);
    ctx.fillStyle = '#a8a29e'; ctx.font = '26px sans-serif';
    ctx.fillText('SIAPA NAK BIDA?', W / 2, H - 40); ctx.textAlign = 'left';
}

const BINGKAI = { rider: bingkaiRider, crypto: bingkaiCrypto, jackpot: bingkaiJackpot, polis: bingkaiPolis, buah: bingkaiBuah, lelong: bingkaiLelong };

async function ffmpegPath() {
    try { const m = await import('ffmpeg-static'); return m.default || 'ffmpeg'; } catch { return 'ffmpeg'; }
}
function kodkan(args, cwd) {
    return new Promise(async (resolve, reject) => {
        const bin = await ffmpegPath();
        const proc = spawn(bin, args, { cwd });
        let ralat = '';
        proc.stderr.on('data', d => { ralat += d.toString(); });
        proc.on('error', reject);
        proc.on('close', code => code === 0 ? resolve() : reject(new Error(`ffmpeg ${code}: ${ralat.slice(-200)}`)));
    });
}
async function jana(jenis, params) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'klip-'));
    try {
        for (let i = 0; i < JUMLAH; i++) {
            const canvas = createCanvas(W, H), ctx = canvas.getContext('2d');
            BINGKAI[jenis](ctx, i / (JUMLAH - 1), params);
            fs.writeFileSync(path.join(dir, `f${String(i).padStart(3, '0')}.png`), canvas.toBuffer('image/png'));
        }
        const out = path.join(dir, 'out.mp4');
        await kodkan(['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', 'f%03d.png',
            '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '32', '-preset', 'veryfast', '-movflags', '+faststart', out], dir);
        return fs.readFileSync(out);
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

/** Pulang MP4 5 saat untuk jenis tertentu, atau null. Satu klip pada satu masa. */
export async function klipScene(jenis, params = {}) {
    if (!BINGKAI[jenis]) return null;
    const hariIni = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);
    const kuota = await store.get('klip', 'hari', { day: '', n: 0 });
    const nHari = kuota.day === hariIni ? kuota.n : 0;
    if (nHari >= HAD_HARIAN) { console.warn('[KLIP] had harian dicapai, klip dilangkau'); return null; }
    return klipScene2(jenis, params, hariIni, nHari);
}

function klipScene2(jenis, params, hariIni, nHari) {
    if (jenis === 'rider' && (!BANDAR[params.dari] || !BANDAR[params.ke])) return Promise.resolve(null);
    const kunci = `${jenis}|${JSON.stringify(jenis === 'crypto' ? { ...params, candles: params.candles?.slice(-20) } : params)}`;
    const ada = cache.get(kunci);
    if (ada && Date.now() - ada.t < CACHE_MS) return Promise.resolve(ada.buf);
    const hasil = giliran.then(async () => {
        try {
            const buf = await jana(jenis, params);
            await store.set('klip', 'hari', { day: hariIni, n: nHari + 1 });
            cache.set(kunci, { buf, t: Date.now() });
            if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
            return buf;
        } catch (e) {
            console.error('[KLIP]', jenis, e.message);
            return null;
        }
    });
    giliran = hasil.catch(() => {});
    return hasil;
}

/** Klip penghantaran rider (kekal untuk kompatibiliti). */
export function klipRider({ dari, ke, bayar }) {
    return klipScene('rider', { dari, ke, bayar: Math.round(bayar) });
}
