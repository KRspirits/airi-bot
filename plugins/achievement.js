import { createCanvas, loadImage } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';
import { CATALOG, ensureP, ownedNames } from '../lib/fish.js';
import { rr } from '../lib/card.js';
import { paintLogo } from '../lib/brand.js';

// =========================================================================
// 🏆 PENCAPAIAN v17 - 15 pencapaian dari aktiviti sebenar pemain.
// Unlock disimpan dalam user.badges (sama dengan .badge), jadi tak hilang.
// Kad guna gambar Airi (assets/airi.png) sebagai latar; tiada gambar = gradient.
// Susunan dua lajur supaya 15 item muat dalam satu kad 720x1280.
// =========================================================================

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ART = path.join(__dirname, '..', 'assets', 'airi.png');

/**
 * Kira semua pencapaian. Pure function (boleh diuji tanpa WhatsApp).
 * owned: Set nama ikan. stats: user.stats. catalog: { biasa, rare, mitos }. wallet: baki wallet + bank.
 */
// Hadiah tunai sekali (dibayar bila pertama kali dibuka). Kecil supaya tak banjir duit.
export const REWARDS = {
    'Pemancing Pertama': 5000, 'Koleksi 10 Spesies': 15000, 'Galeri 30 Spesies': 40000,
    'Pemburu Rare': 25000, 'Juara Rare': 80000, 'Pemilik Mitos': 50000, 'Kaki Mitos': 150000,
    'Mitos Lengkap': 500000, 'Album Biasa Lengkap': 100000, 'Tukang Besi': 40000,
    'Harta Karun': 20000, 'Penjual Gambar': 15000, 'Pemenang Lelong': 30000,
    'Penjudi Berani': 60000, 'Jutawan Kecil': 250000
};

export function computeAchievements(owned, stats = {}, catalog = CATALOG, wallet = 0) {
    const cnt = list => (list || []).filter(f => owned.has(f.nama)).length;
    const total = owned.size;
    const rare = cnt(catalog.rare), mitos = cnt(catalog.mitos), biasa = cnt(catalog.biasa);
    const s = k => Number(stats[k] || 0);
    const defs = [
        { id: 'Pemancing Pertama', desc: 'Tangkap 1 spesies', cur: total, target: 1 },
        { id: 'Koleksi 10 Spesies', desc: 'Miliki 20 spesies berbeza', cur: total, target: 20 },
        { id: 'Galeri 30 Spesies', desc: 'Miliki 60 spesies berbeza', cur: total, target: 60 },
        { id: 'Pemburu Rare', desc: 'Miliki 25 ikan rare', cur: rare, target: 25 },
        { id: 'Juara Rare', desc: 'Miliki 50 ikan rare', cur: rare, target: 50 },
        { id: 'Pemilik Mitos', desc: 'Tangkap 1 ikan mitos', cur: mitos, target: 1 },
        { id: 'Kaki Mitos', desc: 'Miliki 5 ikan mitos', cur: mitos, target: 5 },
        { id: 'Mitos Lengkap', desc: 'Lengkapkan semua ikan mitos', cur: mitos, target: (catalog.mitos || []).length || 1 },
        { id: 'Album Biasa Lengkap', desc: 'Lengkapkan semua ikan biasa', cur: biasa, target: (catalog.biasa || []).length || 1 },
        { id: 'Tukang Besi', desc: 'Tarik magnet 200 kali', cur: s('magnet_tarik'), target: 200 },
        { id: 'Harta Karun', desc: 'Jumpa 3 harta karun magnet', cur: s('magnet_treasure'), target: 3 },
        { id: 'Penjual Gambar', desc: 'Jual 20 barang guna gambar', cur: s('jual_total'), target: 20 },
        { id: 'Pemenang Lelong', desc: 'Menang 5 lelongan kontena', cur: s('lelong_menang'), target: 5 },
        { id: 'Penjudi Berani', desc: 'Main 100 permainan judi AI', cur: s('judi_ai'), target: 100 },
        { id: 'Jutawan Kecil', desc: 'Kumpul RM 10,000,000 (poket + bank)', cur: Math.floor(Number(wallet) || 0), target: 10000000 }
    ];
    return defs.map(d => ({ ...d, cur: Math.min(d.cur, d.target), unlocked: d.cur >= d.target }));
}

async function drawCard(list, nama) {
    const W = 720, H = 1280;
    const c = createCanvas(W, H), ctx = c.getContext('2d');
    let bg = null;
    try { bg = await loadImage(ART); } catch { bg = null; }
    if (bg) {
        const sc = Math.max(W / bg.width, H / bg.height);
        const dw = bg.width * sc, dh = bg.height * sc;
        ctx.drawImage(bg, (W - dw) / 2, (H - dh) / 2, dw, dh);
    } else {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#04121f'); g.addColorStop(1, '#0b2a45');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    const shade = ctx.createLinearGradient(0, 0, 0, H);
    shade.addColorStop(0, 'rgba(4,18,31,0.60)'); shade.addColorStop(0.35, 'rgba(4,18,31,0.85)'); shade.addColorStop(1, 'rgba(4,18,31,0.96)');
    ctx.fillStyle = shade; ctx.fillRect(0, 0, W, H);
    paintLogo(ctx, W - 190, 8, 170);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#7dd3fc'; ctx.font = 'bold 22px sans-serif';
    ctx.fillText("AIRI'S CORNER", 40, 58);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 50px sans-serif';
    ctx.fillText('PENCAPAIAN', 40, 116);
    ctx.fillStyle = '#94a3b8'; ctx.font = '24px sans-serif';
    ctx.fillText(String(nama).slice(0, 34), 40, 154);
    const dibuka = list.filter(x => x.unlocked).length;
    ctx.textAlign = 'right'; ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 26px sans-serif';
    ctx.fillText(`${dibuka}/${list.length} dibuka`, W - 40, 116);

    const colW = 320, gap = 20, rowH = 122, top = 200;
    list.forEach((a, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const x = 40 + col * (colW + gap), y = top + row * rowH;
        ctx.fillStyle = a.unlocked ? 'rgba(251,191,36,0.20)' : 'rgba(255,255,255,0.06)';
        rr(ctx, x, y, colW, rowH - 14, 18); ctx.fill();
        ctx.textAlign = 'left';
        ctx.fillStyle = a.unlocked ? '#fbbf24' : '#64748b'; ctx.font = 'bold 21px sans-serif';
        ctx.fillText((a.unlocked ? '✔ ' : '○ ') + a.id, x + 16, y + 30);
        ctx.fillStyle = '#cbd5e1'; ctx.font = '16px sans-serif';
        ctx.fillText(a.desc, x + 16, y + 54);
        const bx = x + 16, by = y + 66, bw = colW - 32, bh = 8;
        ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = a.unlocked ? '#fbbf24' : '#38bdf8';
        ctx.fillRect(bx, by, bw * (a.cur / a.target), bh);
        ctx.textAlign = 'right'; ctx.fillStyle = '#e2e8f0'; ctx.font = '14px sans-serif';
        ctx.fillText(`${a.cur.toLocaleString('en-US')}/${a.target.toLocaleString('en-US')}`, x + colW - 16, y + 84);
    });
    return c.toBuffer('image/png');
}

export default {
    name: 'achievement',
    alias: ['achievements', 'pencapaian'],
    category: 'pencapaian',
    execute: async ({ sock, m, db }) => {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || jid;
        const reply = text => sock.sendMessage(jid, { text }, { quoted: m });
        try {
            const user = await db.getUser(sender);
            const pd = ensureP(sender);
            const owned = ownedNames(pd);
            const wallet = (user.wallet || 0) + (user.bank || 0);
            const list = computeAchievements(owned, user.stats || {}, CATALOG, wallet);

            const baru = [];
            user.badges = Array.isArray(user.badges) ? user.badges : [];
            let hadiah = 0;
            for (const a of list) if (a.unlocked && !user.badges.includes(a.id)) {
                user.badges.push(a.id); baru.push(a.id); hadiah += REWARDS[a.id] || 0;
            }
            if (hadiah) user.wallet = (user.wallet || 0) + hadiah;
            if (baru.length) await db.saveUser(user);

            const img = await drawCard(list, user.name || 'Warga Gelap');
            const dibuka = list.filter(x => x.unlocked).length;
            const teks = baru.length ? `\n🎉 Badge baharu: ${baru.join(', ')}\n💰 Hadiah: RM ${hadiah.toLocaleString('en-US')}` : '';
            return sock.sendMessage(jid, { image: img, caption: `🏆 Pencapaian kau: ${dibuka}/${list.length}${teks}` }, { quoted: m });
        } catch (e) {
            console.error('[ACHIEVEMENT]', e.message);
            return reply('⚠️ Ada ralat masa papar pencapaian. Cuba lagi.');
        }
    }
};
