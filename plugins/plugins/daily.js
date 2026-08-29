export default {
    name: 'daily',
    alias: ['harian', 'tuntut'],
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const now = Date.now();
        const cooldownTime = 24 * 60 * 60 * 1000; // 24 Jam

        if (!user.lastDaily) user.lastDaily = 0;

        if (now - user.lastDaily < cooldownTime) {
            const sisaWaktu = Math.ceil((cooldownTime - (now - user.lastDaily)) / (1000 * 60 * 60));
            return sock.sendMessage(jid, { 
                text: `⏳ *SABAR DULU, AMAR/WARGA!*\n\nAnda sudah tuntut hadiah harian. Sila tunggu lagi *${sisaWaktu} jam* sebelum tuntut semula!` 
            }, { quoted: m });
        }

        // Ganjaran harian
        const bonusTunai = 50000;
        user.wallet = (user.wallet || 0) + bonusTunai;
        user.lastDaily = now;
        await db.saveUser(user);

        return sock.sendMessage(jid, { 
            text: `🎁 *TUNTUTAN HARIAN BERJAYA!*\n\n💰 Tunai diterima: RM ${bonusTunai.toLocaleString()}\n✨ Jumpa lagi esok untuk bonus seterusnya!` 
        }, { quoted: m });
    }
};
