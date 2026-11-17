import { serang, bossSemasa } from '../lib/boss.js';

// ⚔️ .serang  -> serang bos yang sedang muncul dalam group
// 👹 .bos     -> lihat bos semasa (HP dan masa tinggal)
export default {
    name: 'serang',
    alias: ['bos'],
    category: 'hiburan',
    execute: async ({ sock, m, user }) => {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: '⚔️ Bos hanya muncul dalam group.' }, { quoted: m });
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const cmd = teks.trim().split(/\s+/)[0].slice(1).toLowerCase();
        if (cmd === 'bos') {
            const b = bossSemasa(jid);
            if (!b) return sock.sendMessage(jid, { text: '😴 Tiada bos sekarang.' }, { quoted: m });
            const baki = Math.max(0, Math.round((b.tamat - Date.now()) / 60e3));
            return sock.sendMessage(jid, { text: `👹 *${b.nama}*\n❤️ HP: ${b.hpSemasa}/${b.hp}\n⏳ Masa tinggal: ${baki} minit\nYang TAK lawan akan kena curi ${Math.round(b.curi * 100)}% duit bank.` }, { quoted: m });
        }
        const sender = m.key.participant || jid;
        const hasil = await serang(jid, sender, user);
        return sock.sendMessage(jid, { text: hasil.mesej, mentions: hasil.mentions || [] }, { quoted: m });
    }
};
