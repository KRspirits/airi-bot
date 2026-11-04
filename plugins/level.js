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
        const asasLv = xpUntukLevel(lv), jurang = Math.max(1, seterusnya - asasLv);
        const peratus = Math.min(1, Math.max(0, (xp - asasLv) / jurang));
        const blok = Math.round(peratus * 20);
        const bar = '█'.repeat(blok) + '░'.repeat(20 - blok);
        const teks = `⭐ *LEVEL KAU*\n\nLevel: *${lv}*\nXP: ${xp.toLocaleString('en-US')} / ${seterusnya.toLocaleString('en-US')}\n[${bar}] ${Math.round(peratus * 100)}%\n\n🔓 Mancing: level 3\n🔓 Magnet: level 6\n🔓 Jala: level 8`;
        return sock.sendMessage(jid, { text: teks }, { quoted: m });
    }
};
