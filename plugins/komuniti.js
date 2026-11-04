export default {
    name: 'komuniti',
    alias: ['pantun', 'lumba_siput', 'santau'],
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const commandUsed = teks.slice(1).trim().split(' ')[0].toLowerCase();
        const args = teks.trim().split(' ').slice(1);
        const targetJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

        // 1. PERTARUNGAN PANTUN (.pantun)
        if (commandUsed === 'pantun') {
            const pantunList = [
                "Dua tiga kucing berlari, mana nak sama si kucing belang; Duit dalam bank dicuri, muka Airi tersenyum riang!",
                "Kain pelekat corak berseri, singgah makan di Tanjung Kling; Bila poket dah tak berisi, muka awak mula rasa pening!",
                "Pecah kaca pecah gelas, sudah baca harap balas; Kalau kena tangkap polis, jangan menangis minta dilepas!"
            ];
            const p = pantunList[Math.floor(Math.random() * pantunList.length)];
            return sock.sendMessage(jid, { text: `📜 *PANTUN DUA KERAT AIRI:*\n\n_"${p}"_` }, { quoted: m });
        }

        // 2. LUMBA SIPUT BABI (.lumba_siput)
        if (commandUsed === 'lumba_siput') {
            const siput = ['Siput Turbo', 'Siput Lendir Klang', 'Siput Mengantuk'];
            const pemenang = siput[Math.floor(Math.random() * siput.length)];

            return sock.sendMessage(jid, {
                text: `
🐌 *PERLUMBAAN SIPUT BABI PERDANA*
───────────────────────────
🏁 Garisan Pelepasan Dibuka...
🐌 Siput 1 merayap...
🐌 Siput 2 terlekat pada daun kangkung...
🐌 Siput 3 laju sedikit!
───────────────────────────
🏆 Juara: *${pemenang}* dinobatkan sebagai siput terpantas!`
            }, { quoted: m });
        }

        // 3. SANTAU MAYA (.santau @user)
        if (commandUsed === 'santau') {
            if (!targetJid) return sock.sendMessage(jid, { text: '❌ Tag mangsa yang awak nak santau! Contoh: `.santau @user`' }, { quoted: m });

            const kosSantau = 2500;
            if (user.wallet < kosSantau) return sock.sendMessage(jid, { text: `❌ Kos upah dukun santau RM ${kosSantau.toLocaleString()}!` }, { quoted: m });

            user.wallet -= kosSantau;
            const target = await db.getUser(targetJid);

            // Efek santau: Mangsa muntah paku, duit poket bocor RM 1,000 - RM 3,000
            const bocor = Math.floor(Math.random() * 2000 + 1000);
            target.wallet = Math.max(0, target.wallet - bocor);

            await db.saveUser(user);
            await db.saveUser(target);

            return sock.sendMessage(jid, {
                text: `
┌───「 🪆 𝗨𝗦𝗜𝗞𝗔𝗡 𝗦𝗔𝗡𝗧𝗔𝗨 𝗠𝗔𝗬𝗔 」
├ 🎯 𝗠𝗮𝗻𝗴𝘀𝗮 : @${targetJid.split('@')[0]}
├ 💥 𝗞𝗲𝘀    : Dukun menghantar angin lintar muntah jarum!
├ 💸 𝗞𝗲𝘀𝗮𝗻  : Duit mangsa tercicir RM ${bocor.toLocaleString()}!
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "Kena santau online ke tu? Pergi cari air penawar cepat!"`,
                mentions: [targetJid]
            }, { quoted: m });
        }
    }
};
