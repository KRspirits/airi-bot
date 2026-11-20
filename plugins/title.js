import { bukaPilihan } from '../lib/pilihan.js';
import { renderSenaraiGelaran } from '../lib/titlecard.js';

// 🏷️ GELARAN IC
//   .title          -> gambar senarai gelaran yang awak ada, balas nombor untuk pilih
//   .set_title [n]  -> tetapkan gelaran yang dipaparkan dalam IC
const SEMBUNYI = new Set(['Ahli Baru']);
const DEFAULT = 'Warga Biasa';

export function senaraiGelaranUser(user) {
    const dapat = (user.badges || []).filter(b => !SEMBUNYI.has(b));
    return [DEFAULT, ...dapat.filter((b, i, arr) => arr.indexOf(b) === i)];
}

export default {
    name: 'title',
    alias: ['set_title'],
    category: 'akaun',
    execute: async ({ sock, m, user, db, args = [] }) => {
        const jid = m.key.remoteJid;
        const sender = m.senderJid || m.key.participant || jid;
        const reply = (t) => sock.sendMessage(jid, { text: t }, { quoted: m });
        const teks = (m.message?.conversation || m.message?.extendedTextMessage?.text || '').trim();
        const cmd = teks.split(/\s+/)[0].slice(1).toLowerCase();
        const senarai = senaraiGelaranUser(user);

        if (cmd === 'set_title' || args.length) {
            const nomor = parseInt(args[0], 10);
            if (!nomor || nomor < 1 || nomor > senarai.length) return reply('❌ Pilih nombor gelaran yang betul. Taip `.title` untuk tengok senarai.');
            user.title = senarai[nomor - 1] === DEFAULT ? null : senarai[nomor - 1];
            await db.saveUser(user);
            return reply(`🏷️ Gelaran dalam IC ditukar kepada *${senarai[nomor - 1]}*.`);
        }

        const aktif = user.title || DEFAULT;
        bukaPilihan(sender, senarai.map((g, i) => ({ arahan: `.set_title ${i + 1}` })));
        const gambar = renderSenaraiGelaran(senarai, aktif);
        return sock.sendMessage(jid, { image: gambar, caption: `🏷️ Gelaran yang awak ada: ${senarai.length}. Balas nombor untuk pilih (tamat 5 minit).` }, { quoted: m });
    },
};
