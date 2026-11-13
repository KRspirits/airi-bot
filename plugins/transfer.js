import { pindahDuit } from '../lib/pindah.js';

// 💸 .transfer @user [jumlah]  (alias: .pay, .sedekah)
export default {
    name: 'transfer',
    alias: ['pay', 'sedekah'],
    category: 'ekonomi',
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const reply = t => sock.sendMessage(jid, { text: t }, { quoted: m });
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const targetJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const jumlah = parseInt(teks.trim().split(/\s+/).find(x => /^\d+$/.test(x)), 10);
        if (!targetJid || !Number.isFinite(jumlah)) return reply('❌ Format: `.transfer @user [jumlah]`');
        const hasil = await pindahDuit(db, user, targetJid, jumlah);
        if (!hasil.ok) return reply(`❌ ${hasil.mesej}`);
        return sock.sendMessage(jid, { text: `✅ Berjaya pindah RM ${jumlah.toLocaleString('en-US')} kepada @${targetJid.split('@')[0]}\nBaki awak: RM ${(user.wallet || 0).toLocaleString('en-US')}`, mentions: [targetJid] }, { quoted: m });
    }
};
