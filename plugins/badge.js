export default {
    name: 'badge',
    alias: ['gelaran', 'claim_badge'],
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const badgesEarned = [];

        // Semakan syarat badge
        if ((user.stats?.race_win || 0) >= 15) badgesEarned.push("🏎️ [RAJA HIGHWAY KARAK]");
        if ((user.stats?.fish_caught || 0) >= 30) badgesEarned.push("🎣 [PAWANG LAUT DALAM]");
        if ((user.stats?.crimes_done || 0) >= 20) badgesEarned.push("🏴‍☠️ [BURONAN BUKIT AMAN]");
        if ((user.wallet + user.bank) >= 1000000) badgesEarned.push("💎 [JUTAWAN CYBER]");

        user.badges = badgesEarned;
        await db.saveUser(user);

        if (badgesEarned.length === 0) {
            return sock.sendMessage(jid, {
                text: `
🎖️ *PAPAN REPUTASI & GELARAN*
Kau belum layak menuntut sebarang lencana kehormat!

🎯 *Misi Terbuka:*
• Menang 15x Lumba Drag ➔ \`🏎️ [RAJA HIGHWAY KARAK]\`
• Tangkap 30x Ikan Jeti ➔ \`🎣 [PAWANG LAUT DALAM]\`
• Selesaikan 20x Jenayah ➔ \`🏴‍☠️ [BURONAN BUKIT AMAN]\`
• Capai Kekayaan RM 1 Juta ➔ \`💎 [JUTAWAN CYBER]\``
            }, { quoted: m });
        }

        let senarai = `┌───「 🎖️ 𝗣𝗔𝗣𝗔𝗡 𝗚𝗘𝗟𝗔𝗥𝗔𝗡 𝗗𝗔𝗡 𝗟𝗘𝗡𝗖𝗔𝗡𝗔 」\n├───────────────────────────\n`;
        badgesEarned.forEach(b => {
            senarai += `├ ✨ *${b}*\n`;
        });
        senarai += `└───────────────────────────\nLencana kini terpapar pada profil rasmi anda (\`.myid\`).`;

        return sock.sendMessage(jid, { text: senarai }, { quoted: m });
    }
};
