export default {
    name: 'transfer',
    alias: ['pay', 'sedekah'],
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const targetJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const args = teks.trim().split(' ').slice(1);

        if (!targetJid || !args[1]) {
            return sock.sendMessage(jid, { 
                text: '❌ Format salah! Cara guna: `.transfer @user [jumlah]`' 
            }, { quoted: m });
        }

        const amount = parseInt(args[1]);
        if (isNaN(amount) || amount <= 0) {
            return sock.sendMessage(jid, { text: '❌ Masukkan amaun pemindahan yang sah!' }, { quoted: m });
        }

        if (user.wallet < amount) {
            return sock.sendMessage(jid, { 
                text: `❌ Duit poket awak tak cukup. Cuma ada RM ${user.wallet.toLocaleString()}` 
            }, { quoted: m });
        }

        // Ambil profil sasaran
        const targetUser = await db.getUser(targetJid);

        user.wallet -= amount;
        targetUser.wallet += amount;

        await db.saveUser(user);
        await db.saveUser(targetUser);

        const respon = `
┌───「 💸 𝗣𝗘𝗠𝗜𝗡𝗗𝗔𝗛𝗔𝗡 𝗧𝗨𝗡𝗔𝗜 」
├ 📤 𝗣𝗲𝗻𝗴𝗵𝗮𝗻𝘁𝗮𝗿 : @${(m.key.participant || jid).split('@')[0]}
├ 📥 𝗣𝗲𝗻𝗲𝗿𝗶𝗺𝗮   : @${targetJid.split('@')[0]}
├ 💵 𝗔𝗺𝗮𝘂𝗻      : RM ${amount.toLocaleString()}
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "Ada orang buat amal jariah nampak! Jangan esok merengek minta balik dah la."`;

        return sock.sendMessage(jid, { 
            text: respon, 
            mentions: [m.key.participant || jid, targetJid] 
        }, { quoted: m });
    }
};
