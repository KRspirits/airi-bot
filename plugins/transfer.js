import { pindahDuit } from '../lib/pindah.js';

// 💸 .transfer @user [jumlah]   (alias: .pay, .sedekah). Jumlah dalam RM.
export default {
    name: 'transfer',
    alias: ['pay', 'sedekah'],
    category: 'ekonomi',
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const pengirimJid = m.key.participant || jid;
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const targetJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const nombor = parseInt(teks.trim().split(/\s+/).find(x => /^\d+$/.test(x)), 10);
        const reply = (t, mentions) => sock.sendMessage(jid, mentions ? { text: t, mentions } : { text: t }, { quoted: m });

        if (!targetJid || !Number.isFinite(nombor)) return reply('❌ Format: `.transfer @user [jumlah]` (dalam RM).');
        if (targetJid === pengirimJid) return reply('😅 Tak boleh hantar duit kepada diri sendiri.');
        if (nombor < 1) return reply('❌ Minimum pindahan ialah RM 1.');

        const hasil = await pindahDuit(db, user, targetJid, nombor);
        if (!hasil.ok) return reply(`❌ ${hasil.mesej}`);
        const rp = n => 'RM ' + Math.round(n).toLocaleString('en-US');
        const nomPengirim = `@${pengirimJid.split('@')[0]}`;
        const nomPenerima = `@${targetJid.split('@')[0]}`;
        return reply(
            `💸 ${nomPengirim} hantar *${rp(nombor)}* kepada ${nomPenerima}\n` +
            `💰 Baki ${nomPengirim}: ${rp(user.wallet || 0)}`,
            [pengirimJid, targetJid]
        );
    }
};
