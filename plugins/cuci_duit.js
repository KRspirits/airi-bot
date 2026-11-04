export default {
    name: 'cuci_duit',
    alias: ['laundering', 'cuciduit'],
    execute: async ({ sock, m, user, db }) => {
        try {
            const jid = m.key.remoteJid;
            const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
            const args = teks.trim().split(' ').slice(1);
            
            const jumlahBeli = parseInt(args[0]);
            
            if (!jumlahBeli || isNaN(jumlahBeli) || jumlahBeli <= 0) {
                return sock.sendMessage(jid, { 
                    text: '❌ Format salah! Sila taip: `.cuci_duit [jumlah]`\n\n*Nota:* Kadar cukai pasaran gelap (Orang Tengah) ialah 20%.' 
                }, { quoted: m });
            }
            
            // Pastikan parameter duit haram wujud
            if (!user.dirty_money) user.dirty_money = 0;

            if (user.dirty_money < jumlahBeli) {
                return sock.sendMessage(jid, { 
                    text: `❌ Duit haram awak tak cukup untuk dicuci!\n💰 Baki duit haram: RM ${user.dirty_money.toLocaleString()}` 
                }, { quoted: m });
            }

            // Proses pembersihan (potong 20% fee)
            const fee = Math.floor(jumlahBeli * 0.20);
            const bersih = jumlahBeli - fee;

            user.dirty_money -= jumlahBeli;
            user.wallet = (user.wallet || 0) + bersih;
            await db.saveUser(user);

            return sock.sendMessage(jid, { 
                text: `🏴‍☠️ *PROSES CUCI DUIT BERJAYA!*\n\n💸 Duit Haram Dicuci: RM ${jumlahBeli.toLocaleString()}\n📉 Caj Orang Tengah (20%): - RM ${fee.toLocaleString()}\n💰 Duit Halal Diterima: RM ${bersih.toLocaleString()}` 
            }, { quoted: m });
        } catch (err) {
            console.error("Cuci Duit Error:", err);
        }
    }
};
