// Memori global untuk event trak wang kilat (.kutip)
const kutipState = {};

// Fungsi Eksport untuk Event Kilat Trak Wang dipanggil dari index.js
export async function triggerSpeedDrop(sock, targetGroup) {
    const kodRahsia = Math.floor(Math.random() * 900) + 100; // Nombor 3 digit rawak cth: 140
    const jumlahWang = Math.floor(Math.random() * 50000) + 10000;

    kutipState[targetGroup] = {
        aktif: true,
        kod: kodRahsia,
        jumlah: jumlahWang
    };

    let msg = `┌───「 🚚 𝗧𝗥𝗔𝗞 𝗦𝗘𝗞𝗨𝗥𝗜𝗧𝗜 𝗧𝗘𝗥𝗕𝗔𝗟𝗜𝗞! 」\n` +
              `│ *Pintu belakang van keselamatan pecah di Federal Highway!*\n` +
              `├───────────────────────────\n` +
              `├ 💰 Wang Tercicir : RM ${jumlahWang.toLocaleString()}\n` +
              `├ ⚡ Tindakan Pantas: Taip kod di bawah terpantas!\n` +
              `└───────────────────────────\n\n` +
              `👉 Taip segera: \`.kutip ${kodRahsia}\``;

    await sock.sendMessage(targetGroup, { text: msg });

    // Masa luput 30 saat
    setTimeout(() => {
        if (kutipState[targetGroup] && kutipState[targetGroup].aktif) {
            delete kutipState[targetGroup];
            sock.sendMessage(targetGroup, { text: `☁️ Orang ramai dah sapu habis semua duit di jalan raya!` }).catch(() => {});
        }
    }, 30000);
}

export default {
    name: 'kutip',
    alias: ['grab', 'ambil'],
    execute: async ({ sock, m, user, db }) => {
        try {
            const jid = m.key.remoteJid;
            const senderId = m.key.participant || jid;
            const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
            const args = teks.trim().split(' ').slice(1);

            const kodMasuk = parseInt(args[0]);
            
            if (!kutipState[jid] || !kutipState[jid].aktif) {
                return sock.sendMessage(jid, { text: `❌ Tiada trak duit terbalik buat masa ni.` }, { quoted: m });
            }

            if (isNaN(kodMasuk) || kodMasuk !== kutipState[jid].kod) {
                return sock.sendMessage(jid, { text: `❌ Kod salah! Cepat cuba lagi.` }, { quoted: m });
            }

            const hadiah = kutipState[jid].jumlah;
            delete kutipState[jid]; // Tutup event supaya orang lain tak boleh kutip dah

            user.wallet += hadiah;
            await db.saveUser(user);

            return sock.sendMessage(jid, { 
                text: `⚡ *PANTAS!* @${senderId.split('@')[0]} berjaya menyambar beg duit sebanyak *RM ${hadiah.toLocaleString()}* dari tengah lebuh raya!`, 
                mentions: [senderId] 
            }, { quoted: m });

        } catch (err) {
            console.error("Kutip Error:", err);
        }
    }
};
