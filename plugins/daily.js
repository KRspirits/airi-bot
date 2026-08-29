export default {
    name: 'daily',
    alias: ['harian', 'tuntut'],
    execute: async ({ sock, m, user, db }) => {
        try {
            const jid = m.key.remoteJid;
            const now = Date.now();
            const cooldownTime = 24 * 60 * 60 * 1000; 

            if (!user.lastDaily) user.lastDaily = 0;

            if (now - user.lastDaily < cooldownTime) {
                const sisaWaktu = Math.ceil((cooldownTime - (now - user.lastDaily)) / (1000 * 60 * 60));
                return sock.sendMessage(jid, { 
                    text: `⏳ *SABAR DULU!*\n\nSila tunggu lagi *${sisaWaktu} jam* sebelum tuntut hadiah harian seterusnya!` 
                }, { quoted: m });
            }

            const bonusTunai = 50000;
            user.wallet = (user.wallet || 0) + bonusTunai;
            user.lastDaily = now;
            await db.saveUser(user);

            return sock.sendMessage(jid, { 
                text: `🎁 *TUNTUTAN HARIAN BERJAYA!*\n\n💰 Tunai diterima: RM ${bonusTunai.toLocaleString()}\n✨ Jumpa lagi esok!` 
            }, { quoted: m });
            
        } catch (err) {
            console.error("Daily Error:", err);
        }
    }
};
