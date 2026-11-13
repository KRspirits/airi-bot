import { beriXp } from '../lib/xp.js';
import { sceneCard } from '../lib/scene.js';
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

            // Streak: kalau tuntut dalam 48 jam dari tuntutan lepas, streak sambung. Bonus naik RM1,000 setiap hari sampai hari ke-7.
            const sambung = user.lastDaily && (now - user.lastDaily) < 48 * 60 * 60 * 1000;
            user.streak = sambung ? Math.min((user.streak || 1) + 1, 365) : 1;
            if (user.streak === 7) sock.sendMessage(jid, { image: sceneCard('streak', 7), caption: '🔥 Streak 7 hari berturut-turut! Awak memang setia.' }, { quoted: m }).catch(() => {});
            const bonusTunai = 5000 + Math.min(user.streak - 1, 6) * 1000;
            user.wallet = (user.wallet || 0) + bonusTunai;
            beriXp(user, 50, 'daily');
            user.lastDaily = now;
            await db.saveUser(user);

            return sock.sendMessage(jid, { 
                text: `🎁 *TUNTUTAN HARIAN BERJAYA!*\n\n💰 Tunai diterima: RM ${bonusTunai.toLocaleString()}\n🔥 Streak: ${user.streak} hari\n✨ Jumpa lagi esok!` 
            }, { quoted: m });
            
        } catch (err) {
            console.error("Daily Error:", err);
        }
    }
};
