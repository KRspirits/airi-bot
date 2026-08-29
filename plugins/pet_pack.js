export default {
    name: 'pet_pack',
    alias: ['kedai_pet', 'beli_pet', 'beli_telur', 'tetas_telur'],
    execute: async ({ sock, m, user, db }) => {
        try {
            const jid = m.key.remoteJid;
            const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
            const args = teks.trim().split(' ').slice(1);
            const cmd = teks.slice(1).trim().split(' ')[0].toLowerCase();

            if (cmd === 'kedai_pet') {
                return sock.sendMessage(jid, { 
                    text: `🐾 *KEDAI HAIWAN PELIHARAAN* 🐾\n\n1. Kucing Oyen - RM 5,000\n2. Burung Hantu - RM 15,000\n3. Anak Naga - RM 500,000\n\n🥚 *Telur Misteri* - RM 10,000\n\n*Guna:* \`.beli_pet [nama]\` atau \`.beli_telur\`` 
                }, { quoted: m });
            }

            if (cmd === 'beli_telur') {
                const harga = 10000;
                if (user.wallet < harga) return sock.sendMessage(jid, { text: `❌ Duit poket tak cukup RM 10,000 untuk beli telur!` }, { quoted: m });
                
                user.wallet -= harga;
                user.telur_pet = (user.telur_pet || 0) + 1;
                await db.saveUser(user);
                return sock.sendMessage(jid, { text: `🥚 Kau berjaya beli 1x Telur Misteri!\nTaip \`.tetas_telur\` untuk menetas.` }, { quoted: m });
            }

            if (cmd === 'tetas_telur') {
                if (!user.telur_pet || user.telur_pet <= 0) return sock.sendMessage(jid, { text: `❌ Kau tak ada telur untuk ditetas!` }, { quoted: m });
                
                const haiwan = ['Ayam Serama', 'Ular Sawa', 'Kura-kura Ninja', 'Musang Pandan'];
                const dapat = haiwan[Math.floor(Math.random() * haiwan.length)];
                
                user.telur_pet -= 1;
                user.pet_aktif = dapat;
                await db.saveUser(user);
                
                return sock.sendMessage(jid, { text: `✨ *CRAAAKKK!*\n\nTelur misteri kau pecah dan seekor *${dapat}* keluar! 🐾` }, { quoted: m });
            }
        } catch (err) {
            console.error("Pet Error:", err);
        }
    }
};
