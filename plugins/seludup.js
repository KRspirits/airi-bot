import { bmBuka, BM_BUKA_TEKS } from '../lib/bm.js';

// 🌙 SELUDUP (blackmarket malam). Modal dibayar dulu. Berjaya: jual untuk untung besar.
// Gagal: modal hilang dan kena tahan 30 minit. Untung besar ada CD yang lebih lama.
const BARANG = [
    { id: 'rokok', nama: 'Rokok Seludup', modal: 2000, jual: 6000, peluang: 0.6, cd: 30 * 60e3 },
    { id: 'minyak', nama: 'Minyak Masak Seludup', modal: 5000, jual: 15000, peluang: 0.5, cd: 60 * 60e3 },
    { id: 'telefon', nama: 'Telefon Curi', modal: 20000, jual: 80000, peluang: 0.35, cd: 3 * 60 * 60e3 },
    { id: 'emas', nama: 'Emas Tak Berdaftar', modal: 100000, jual: 500000, peluang: 0.25, cd: 6 * 60 * 60e3 },
];
const rp = n => `RM ${Math.round(Number(n) || 0).toLocaleString('en-US')}`;

export default {
    name: 'seludup',
    alias: [],
    category: 'jenayah',
    execute: async ({ sock, m, user, db, args = [] }) => {
        const jid = m.key.remoteJid;
        const reply = t => sock.sendMessage(jid, { text: t }, { quoted: m });
        if (!bmBuka()) return reply(`🌙 ${BM_BUKA_TEKS}`);

        const now = Date.now();
        if (user.jail?.status && (user.jail.release_at || 0) > now) {
            const minit = Math.ceil((user.jail.release_at - now) / 60e3);
            return reply(`⛓️ Kau masih dalam tahanan. Tinggal ${minit} minit lagi.`);
        }
        const pilih = (args[0] || '').toLowerCase();
        if (!pilih) {
            const senarai = BARANG.map(b => `• \`.seludup ${b.id}\` — ${b.nama}\n   Modal ${rp(b.modal)} · Jual ${rp(b.jual)} · Peluang ${Math.round(b.peluang * 100)}% · CD ${Math.round(b.cd / 60e3)} minit`);
            return reply(`🌙 *BLACKMARKET*\n\n${senarai.join('\n')}`);
        }
        const b = BARANG.find(x => x.id === pilih);
        if (!b) return reply('❌ Barang tu tak ada. Taip `.seludup` untuk senarai.');

        user.stats = user.stats || {};
        const kunciCd = `seludup_${b.id}`;
        const cdTinggal = (user.stats[kunciCd] || 0) + b.cd - now;
        if (cdTinggal > 0) return reply(`⏳ ${b.nama} belum boleh, tunggu ${Math.ceil(cdTinggal / 60e3)} minit lagi.`);
        if ((user.wallet || 0) < b.modal) return reply(`❌ Modal ${rp(b.modal)} tak cukup. Kau ada ${rp(user.wallet || 0)}.`);

        user.wallet -= b.modal;
        user.stats[kunciCd] = now;
        if (Math.random() < b.peluang) {
            user.wallet += b.jual;
            await db.saveUser(user);
            return reply(`✅ *BERJAYA* jual ${b.nama}!\nModal ${rp(b.modal)} · Dapat ${rp(b.jual)}\nUntung bersih ${rp(b.jual - b.modal)}\nBaki sekarang: ${rp(user.wallet)}`);
        }
        user.jail = { ...(user.jail || {}), status: true, release_at: now + 30 * 60e3, reason: 'Seludup' };
        await db.saveUser(user);
        return reply(`🚨 *GAGAL!* ${b.nama} kena tangkap.\nModal ${rp(b.modal)} hilang dan kau ditahan 30 minit.`);
    }
};
