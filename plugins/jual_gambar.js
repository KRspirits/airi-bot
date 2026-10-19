import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { appraiseImage } from '../lib/geminiAI.js';
import { allow } from '../lib/cooldown.js';
import { myt, rm } from '../lib/util.js';

// =========================================================================
// 📸 JUAL GAMBAR v17 - hanya gambar yang DIAMBIL TERUS dari kamera telefon.
// Syarat:
//   1. Hantar sebagai DOKUMEN (ikon fail), bukan gambar biasa. WhatsApp buang EXIF
//      dari gambar biasa, jadi dokumen je yang kekalkan maklumat kamera.
//   2. Fail mesti JPEG/HEIC dengan EXIF kamera (Apple, Samsung, Xiaomi, dll).
//      Tangkapan skrin, gambar muat turun, dan editan (WhatsApp, Snapseed, Photoshop) DITOLAK.
//   3. Harga = 40% anggaran AI, tanpa had harga.
//   4. Had 2 jualan sehari setiap pemain. Tawaran tamat 60 saat, taip .setuju.
// PERHATIAN: EXIF boleh dipalsukan. Ini menghalang cara biasa, bukan penipuan berbakat.
// =========================================================================

export const PAYOUT_RATE = 0.4;
export const MIN_PAYOUT = 50;
export const DAILY_LIMIT = 2;
const OFFER_MS = 60_000;

const CAMERA_MAKERS = ['Apple', 'iPhone', 'Samsung', 'Xiaomi', 'Redmi', 'POCO', 'OPPO', 'vivo', 'realme', 'HUAWEI', 'Honor', 'OnePlus', 'Google', 'Pixel', 'SONY', 'Canon', 'NIKON', 'FUJIFILM', 'Motorola', 'Nokia', 'Infinix', 'Tecno'];
const EDITED_MARKERS = /WhatsApp|Screenshot|Photoshop|GIMP|Snapseed|Lightroom|Canva|Telegram|Instagram|Facebook/i;

/**
 * Semak buffer gambar: pulang nama pembuat kamera jika nampak EXIF kamera tulen, null jika tidak.
 * Tangkapan skrin (PNG), gambar muat turun tanpa EXIF, dan gambar yang disunting ditolak.
 */
export function cameraMaker(buf) {
    if (!Buffer.isBuffer(buf) || buf.length < 200) return null;
    const isJpeg = buf[0] === 0xFF && buf[1] === 0xD8;
    const isHeic = buf.subarray(4, 12).toString('latin1').includes('ftyp');
    if (!isJpeg && !isHeic) return null;
    const idx = buf.indexOf(Buffer.from('Exif\u0000\u0000', 'latin1'));
    if (idx < 0) return null;
    const seg = buf.subarray(idx, Math.min(buf.length, idx + 65536)).toString('latin1');
    if (EDITED_MARKERS.test(seg)) return null;
    const low = seg.toLowerCase();
    return CAMERA_MAKERS.find(c => low.includes(c.toLowerCase())) || null;
}

/** Sahkan dan bersihkan output AI. Pulang null jika tak sah atau ditolak. */
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

/** Kira bayaran: 40% anggaran, tanpa had harga. */
export function payoutFor(anggaran) {
    return Math.floor(anggaran * PAYOUT_RATE);
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

            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const docDirect = m.message?.documentMessage;
            const docQuoted = quoted?.documentMessage;
            const doc = docDirect || docQuoted;
            const biasa = m.message?.imageMessage || quoted?.imageMessage;

            if (!doc && biasa) {
                return reply('📸 Gambar biasa tak boleh dijual. WhatsApp buang maklumat kamera. Hantar sebagai *DOKUMEN* (ikon fail, Attach > Document), kemudian taip `.jual_gambar`.');
            }
            if (!doc || !String(doc.mimetype || '').startsWith('image/')) {
                return reply('📸 Hantar gambar barang kau sebagai *DOKUMEN* dengan caption `.jual_gambar`, atau reply dokumen gambar dengan `.jual_gambar`. Gambar mesti diambil terus dari kamera.');
            }

            if (!allow(sender + ':jgambar', 60000)) return reply('⏳ Sabar, Airi tengah belek barang sebelum ni.');

            const user = await db.getUser(sender);
            const today = myt().day;
            const stat = user.stats?.jual_gambar || {};
            const count = stat.day === today ? (stat.n || 0) : 0;
            if (count >= DAILY_LIMIT) return reply(`❌ Had jualan gambar hari ni dah penuh (${DAILY_LIMIT} kali). Esok boleh jual lagi.`);

            await reply('🔍 Airi tengah tengok gambar kau...');
            const src = docDirect ? { message: m.message } : { message: quoted };
            const buffer = await downloadMediaMessage(src, 'buffer', {}, { logger: console, reuploadRequest: sock.updateMediaMessage });

            const pembuat = cameraMaker(buffer);
            if (!pembuat) {
                return reply('❌ Gambar ni bukan hasil kamera telefon. Tangkapan skrin, gambar muat turun atau gambar yang dah diedit tak boleh dijual. Ambil gambar baru terus dari kamera.');
            }

            const raw = await appraiseImage(buffer.toString('base64'), doc.mimetype || 'image/jpeg');
            const hasil = parseAppraisal(raw);
            if (!hasil) return reply('❌ Airi tak dapat nilai gambar ni. Mungkin bukan barang, ada orang atau haiwan, atau AI sibuk. Cuba gambar lain.');

            const bayar = payoutFor(hasil.anggaran);
            if (bayar < MIN_PAYOUT) return reply(`❌ Barang ni (${hasil.nama}) nilainya terlalu rendah untuk dibeli.`);

            pending.set(sender, { bayar, nama: hasil.nama, expires: Date.now() + OFFER_MS });
            return reply(`🏷️ *TAWARAN AIRI*\n\nBarang: *${hasil.nama}*\nKamera dikesan: ${pembuat}\nAnggaran pasaran: ${rm(hasil.anggaran)} (yakin: ${hasil.yakin})\nTawaran kami: *${rm(bayar)}*\n\nTaip \`.setuju\` dalam 60 saat untuk jual.`);
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
    user.stats.jual_total = (user.stats.jual_total || 0) + 1;
    await db.saveUser(user);
    return reply(`✅ Jual siap! *${offer.nama}* dibeli dengan *${rm(offer.bayar)}*.\nBaki sekarang: ${rm(user.wallet)}`);
}

export { pending as _pending };
