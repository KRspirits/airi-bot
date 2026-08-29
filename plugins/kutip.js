export let dropState = {
    active: false,
    code: '',
    reward: 0,
    chatId: null
};

export async function triggerSpeedDrop(sock, chatId) {
    if (dropState.active) return;

    const kodRawak = Math.floor(100 + Math.random() * 900).toString(); // Kod 3 digit
    const wangHabuan = Math.floor(Math.random() * 15000) + 5000;

    dropState = {
        active: true,
        code: kodRawak,
        reward: wangHabuan,
        chatId: chatId
    };

    const notis = `
┌───「 🚚 𝗧𝗥𝗔𝗞 𝗦𝗘𝗞𝗨𝗥𝗜𝗧𝗜 𝗧𝗘𝗥𝗕𝗔𝗟𝗜𝗞! 」
│ _Pintu belakang van keselamatan pecah di Federal Highway!_
├───────────────────────────
├ 💰 𝗪𝗮𝗻𝗴 𝗧𝗲𝗿𝗰𝗶𝗰𝗶𝗿 : *RM ${wangHabuan.toLocaleString()}*
├ ⚡ 𝗧𝗶𝗻𝗱𝗮𝗸𝗮𝗻 𝗖𝗲𝗽𝗮𝘁: Taip kod di bawah terpantas!
└───────────────────────────
👉 Taip segera: \`.kutip ${kodRawak}\``;

    await sock.sendMessage(chatId, { text: notis });

    // Tamat automatik dalam masa 30 saat jika tiada siapa kutip
    setTimeout(() => {
        if (dropState.active && dropState.chatId === chatId) {
            dropState.active = false;
            sock.sendMessage(chatId, { text: '💨 Orang ramai dah sapu habis semua duit di jalan raya!' });
        }
    }, 30000);
}

export default {
    name: 'kutip',
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const args = teks.trim().split(' ').slice(1);
        const kodInput = args[0]?.trim();

        if (!dropState.active || dropState.chatId !== jid) {
            return sock.sendMessage(jid, { text: '❌ Tiada trak duit terbalik buat masa ni.' }, { quoted: m });
        }

        if (kodInput !== dropState.code) {
            return sock.sendMessage(jid, { text: `❌ Kod salah! Kod yang betul ialah: \`${dropState.code}\`` }, { quoted: m });
        }

        // Pemenang terpantas
        const habuan = dropState.reward;
        dropState.active = false;

        user.wallet += habuan;
        await db.saveUser(user);

        return sock.sendMessage(jid, {
            text: `
🎉 *REAKSI TERPANTAS! HABUAN DISAPU!*
@${(m.key.participant || jid).split('@')[0]} berjaya menyauk *RM ${habuan.toLocaleString()}* dari atas jalan raya sebelum pihak polis tiba!`,
            mentions: [m.key.participant || jid]
        });
    }
};
