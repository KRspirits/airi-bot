import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { appraiseImage } from '../lib/geminiAI.js';
import { allow } from '../lib/cooldown.js';
import { myt, rm } from '../lib/util.js';

// =========================================================================
// 📸 JUAL GAMBAR - hantar gambar barang, AI nilai harga, pemain setuju untuk jual.
// PERHATIAN EKONOMI: bot tak boleh sahkan barang tu milik pemain. Jadi:
//   - bayaran = 40% anggaran, maks RM 5,000 setiap jualan
//   - maks 2 jualan sehari setiap pemain
//   - gambar orang, haiwan atau kandungan tak sesuai DITOLAK
//   - tawaran tamat dalam 60 saat, mesti taip .setuju
// =========================================================================

export const PAYOUT_RATE = 0.4;
export const MAX_PAYOUT = 5000;
export const MIN_PAYOUT = 50;
export const DAILY_LIMIT = 2;
const OFFER_MS = 60_000;

/**
 * Sahkan dan bersihkan output AI. Pulang null jika tak sah atau ditolak.
 * Tahan terhadap teks tambahan, pagar markdown dan nilai pelik.
 */
export function parseAppraisal(raw) {
    if (!raw || typeof raw !== 'string') return null;
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    let obj;
    try { obj = JSON.parse(match[0]); } catch { return null; }
    if (obj.ok !== true) return null;
    const harga = Number(obj.harga_rm);
    if (!Number.isFinite(harga) || harga <= 0) return null;
    const nama = String(obj.nama || 'Barang misteri').replace(/[\p{Extended_Pictographic}]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 60) || 'Barang misteri';
    return { nama, anggaran: Math.min(Math.round(harga), 10_000_000), yakin: String(obj.yakin || 'rendah').toLowerCase() };
}

/** Kira bayaran sebenar selepas had. */
export function payoutFor(anggaran) {
    return Math.min(MAX_PAYOUT, Math.floor(anggaran * PAYOUT_RATE));
}

const pending = new Map(); // sender -> { bayar, nama, expires }

export default {
    name: 'jual_gambar',
    alias: ['jual_gambar', 'setuju'],
    category: 'ekonomi',
    execute: async ({ sock, m, db }) => {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || jid;
        const reply = (text) => sock.sendMessage(jid, { text }, { quoted: m });
        try {
            const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
            const cmd = teks.trim().split(/\s+/)[0].slice(1).toLowerCase();

            if (cmd === 'setuju') return setuju(sender, db, reply);

            const isImage = !!m.message?.imageMessage;
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const isQuoted = !!quoted?.imageMessage;
            if (!isImage && !isQuoted) return reply('📸 Hantar gambar barang dengan caption `.jual_gambar`, atau reply gambar dengan `.jual_gambar`.');

            if (!allow(sender + ':jgambar', 60000)) return reply('⏳ Sabar, Airi tengah belek barang sebelum ni.');

            const user = await db.getUser(sender);
            const today = myt().day;
            const stat = user.stats?.jual_gambar || {};
            const count = stat.day === today ? (stat.n || 0) : 0;
            if (count >= DAILY_LIMIT) return reply(`❌ Had jualan gambar hari ni dah penuh (${DAILY_LIMIT} kali). Cuba esok.`);

            await reply('🔍 Airi tengah belek gambar dan semak nilai pasaran...');
            const src = isImage ? { message: m.message } : { message: quoted };
            const buffer = await downloadMediaMessage(src, 'buffer', {}, { logger: console, reuploadRequest: sock.updateMediaMessage });
            const mime = (isImage ? m.message.imageMessage : quoted.imageMessage).mimetype || 'image/jpeg';
            const raw = await appraiseImage(buffer.toString('base64'), mime);
            const hasil = parseAppraisal(raw);

            if (!hasil) return reply('❌ Airi tak dapat nilai gambar ni. Mungkin bukan barang, ada orang/haiwan, atau AI sibuk. Cuba gambar lain.');
            const bayar = payoutFor(hasil.anggaran);
            if (bayar < MIN_PAYOUT) return reply(`❌ Barang ni ${hasil.nama} nilainya terlalu rendah untuk dibeli.`);

            pending.set(sender, { bayar, nama: hasil.nama, expires: Date.now() + OFFER_MS });
            return reply(`🏷️ *TAWARAN AIRI*\n\nBarang: *${hasil.nama}*\nAnggaran pasaran: ${rm(hasil.anggaran)} (yakin: ${hasil.yakin})\nTawaran kami: *${rm(bayar)}*\n\nTaip \`.setuju\` dalam 60 saat untuk jual. Tawaran ni tak boleh dibatalkan selepas setuju.`);
        } catch (e) {
            console.error('[JUAL GAMBAR]', e.message);
            return reply('⚠️ Ada ralat masa proses gambar. Cuba lagi.');
        }
    }
};

async function setuju(sender, db, reply) {
    const offer = pending.get(sender);
    pending.delete(sender);
    if (!offer || Date.now() > offer.expires) return reply('❌ Tiada tawaran aktif, atau dah tamat. Hantar gambar semula dengan `.jual_gambar`.');

    const user = await db.getUser(sender);
    const today = myt().day;
    const stat = user.stats?.jual_gambar || {};
    const count = stat.day === today ? (stat.n || 0) : 0;
    if (count >= DAILY_LIMIT) return reply(`❌ Had jualan gambar hari ni dah penuh (${DAILY_LIMIT} kali).`);

    user.wallet = (user.wallet || 0) + offer.bayar;
    user.stats = user.stats || {};
    user.stats.jual_gambar = { day: today, n: count + 1 };
    await db.saveUser(user);
    return reply(`✅ Jualan berjaya! *${offer.nama}* dibeli dengan *${rm(offer.bayar)}*.\nBaki sekarang: ${rm(user.wallet)}`);
}

export { pending as _pending };
