import { levelOf, xpUntukLevel } from '../lib/level.js';

// Tunjuk level & XP. Kumpul XP dengan .kerja (+15) dan .daily (+50).
export default {
    name: 'level',
    alias: ['xp', 'pangkat'],
    category: 'info',
    execute: async ({ sock, m, user }) => {
        const jid = m.key.remoteJid;
        const lv = levelOf(user);
        const xp = Number(user.xp) || 0;
        const seterusnya = xpUntukLevel(lv + 1);
        const teks = `⭐ *LEVEL KAU*\n\nLevel: *${lv}*\nXP: ${xp.toLocaleString('en-US')}\nLevel seterusnya pada ${seterusnya.toLocaleString('en-US')} XP\n\n🔓 Mancing: level 3\n🔓 Magnet: level 6\n🔓 Jala: level 8`;
        return sock.sendMessage(jid, { text: teks }, { quoted: m });
    }
};
