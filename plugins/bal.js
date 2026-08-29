export default {
    name: 'bal',
    alias: ['balance', 'duit', 'wallet'],
    execute: async ({ sock, m, user }) => {
        const jid = m.key.remoteJid;
        const senderName = m.pushName || 'Warga Gelap';

        const totalKekayaan = user.wallet + user.bank + (user.black_money || 0);

        const statusTeks = user.jail?.status 
            ? '⛓️ Merengkok Dalam Lokap' 
            : '🟢 Bebas / Warga Aman';

        const respon = `
┌───「 💳 𝗣𝗢𝗥𝗧𝗙𝗢𝗟𝗜𝗢 𝗞𝗘𝗪𝗔𝗡𝗚𝗔𝗡 」
├ 👤 𝗡𝗮𝗺𝗮     : ${senderName}
├ 💵 𝗣𝗼𝗸𝗲𝘁    : RM ${user.wallet.toLocaleString()}
├ 🏦 𝗕𝗮𝗻𝗸     : RM ${user.bank.toLocaleString()}
├ 🏴‍☠️ 𝗗𝘂𝗶𝘁 𝗚𝗲𝗹𝗮𝗽: RM ${(user.black_money || 0).toLocaleString()}
├ 📊 𝗝𝘂𝗺𝗹𝗮𝗵   : RM ${totalKekayaan.toLocaleString()}
├ ⚖️ 𝗦𝘁𝗮𝘁𝘂𝘀   : ${statusTeks}
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "Banyak simpan dalam bank tu tak takut kena hack ke bang? Belanja la aku sikit."`;

        return sock.sendMessage(jid, { text: respon }, { quoted: m });
    }
};
