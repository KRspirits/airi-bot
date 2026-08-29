export default {
    name: 'eco_pack',
    alias: ['bal', 'kerja', 'transfer', 'pasaran'],
    execute: async ({ sock, m, user, db }) => {
        try {
            const jid = m.key.remoteJid;
            const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
            const args = teks.trim().split(' ').slice(1);
            const cmd = teks.slice(1).trim().split(' ')[0].toLowerCase();

            if (cmd === 'bal') {
                return sock.sendMessage(jid, { 
                    text: `💳 *AKAUN BANK AIRI*\n\n💵 Tunai Poket: RM ${(user.wallet || 0).toLocaleString()}\n🏦 Baki Bank: RM ${(user.bank || 0).toLocaleString()}\n💸 Duit Haram: RM ${(user.dirty_money || 0).toLocaleString()}` 
                }, { quoted: m });
            }

            if (cmd === 'kerja') {
                const now = Date.now();
                if (user.lastKerja && (now - user.lastKerja < 300000)) { // Cooldown 5 minit
                    return sock.sendMessage(jid, { text: `⏳ Penat bos! Rehat dulu 5 minit sebelum kerja balik.` }, { quoted: m });
                }
                const senaraiKerja = ['GrabFood', 'Jual Burger', 'Jaga Tol', 'Kutip Tin', 'Bawa Lori'];
                const job = senaraiKerja[Math.floor(Math.random() * senaraiKerja.length)];
                const gaji = Math.floor(Math.random() * 2000) + 500;
                
                user.wallet = (user.wallet || 0) + gaji;
                user.lastKerja = now;
                await db.saveUser(user);
                return sock.sendMessage(jid, { text: `💼 Kau kerja sebagai *${job}* dan dibayar RM ${gaji.toLocaleString()}!` }, { quoted: m });
            }

            if (cmd === 'transfer') {
                const targetJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
                const jumlah = parseInt(args[1]);
                if (!targetJid || !jumlah || isNaN(jumlah)) return sock.sendMessage(jid, { text: `❌ Format: \`.transfer @user [jumlah]\`` }, { quoted: m });
                if (user.wallet < jumlah) return sock.sendMessage(jid, { text: `❌ Duit poket tak cukup!` }, { quoted: m });

                const targetUser = await db.getUser(targetJid);
                user.wallet -= jumlah;
                targetUser.wallet = (targetUser.wallet || 0) + jumlah;
                await db.saveUser(user);
                await db.saveUser(targetUser);

                return sock.sendMessage(jid, { text: `✅ Berjaya transfer RM ${jumlah.toLocaleString()} kepada @${targetJid.split('@')[0]}`, mentions: [targetJid] }, { quoted: m });
            }

            if (cmd === 'pasaran') {
                return sock.sendMessage(jid, { 
                    text: `📊 *PASARAN GLOBAL AIRI*\n\n1. Emas (Beli: RM 5,000 | Jual: RM 4,500)\n2. Bitcoin (Beli: RM 250,000 | Jual: Mengikut pasaran)\n3. Besi Buruk (Jual: RM 50/kg)\n\n*Guna:* \`.beli_emas [jumlah]\` atau \`.jual_emas\`` 
                }, { quoted: m });
            }
        } catch (err) {
            console.error("Eco Error:", err);
        }
    }
};
