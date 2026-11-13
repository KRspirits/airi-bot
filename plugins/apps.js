import { APPS, hasApp, pasangApp } from '../lib/apps.js';

// 📱 .app             -> senarai app dan status
// 📱 .app pasang [id] -> pasang app dalam telefon
export default {
    name: 'app',
    alias: ['apps'],
    category: 'kerja',
    execute: async ({ sock, m, user, db, args = [] }) => {
        const jid = m.key.remoteJid;
        const reply = t => sock.sendMessage(jid, { text: t }, { quoted: m });
        if (!user.inventory?.phone) return reply('📱 Beli telefon dulu di `.device`.');
        if ((args[0] || '').toLowerCase() === 'pasang') {
            const hasil = await pasangApp(db, user, (args[1] || '').toLowerCase());
            return reply(hasil.ok ? hasil.mesej : `❌ ${hasil.mesej}`);
        }
        const senarai = Object.entries(APPS).map(([id, a]) =>
            `${hasApp(user, id) ? '✅' : '⬜'} *${a.nama}* — ${a.ket}\n   ${hasApp(user, id) ? 'Dah dipasang' : `Pasang: \`.app pasang ${id}\` (RM ${a.harga.toLocaleString('en-US')})`}`);
        return reply(`📱 *APP TELEFON KAU*\n\n${senarai.join('\n\n')}`);
    }
};
