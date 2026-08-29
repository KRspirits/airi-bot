export default {
    name: 'teka_nombor',
    alias: ['tikam_nombor', 'ekor'],
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const args = teks.trim().split(' ').slice(1);

        if (args.length < 2) {
            return sock.sendMessage(jid, { 
                text: '❌ Cara main: `.teka_nombor [nombor 00-99] [taruhan]`\nContoh: `.teka_nombor 69 500`' 
            }, { quoted: m });
        }

        const tekaan = parseInt(args[0]);
        const taruhan = parseInt(args[1]);

        if (isNaN(tekaan) || tekaan < 0 || tekaan > 99) {
            return sock.sendMessage(jid, { text: '❌ Nombor tekaan mesti antara 0 hingga 99 sahaja!' }, { quoted: m });
        }

        if (isNaN(taruhan) || taruhan <= 0) {
            return sock.sendMessage(jid, { text: '❌ Masukkan amaun taruhan yang sah!' }, { quoted: m });
        }

        if (user.wallet < taruhan) {
            return sock.sendMessage(jid, { text: `❌ Duit poket kau tak cukup RM ${taruhan.toLocaleString()}!` }, { quoted: m });
        }

        // Keputusan cabutan (0 hingga 99)
        const nomborKeluar = Math.floor(Math.random() * 100);
        user.wallet -= taruhan;

        // Format 2 digit (cth: 07, 45)
        const formatTekaan = tekaan.toString().padStart(2, '0');
        const formatKeluar = nomborKeluar.toString().padStart(2, '0');

        if (tekaan === nomborKeluar) {
            const hadiah = taruhan * 20; // Hadiah x20
            user.wallet += hadiah;
            await db.saveUser(user);

            const responTepat = `
┌───「 🎟️ 𝗞𝗘𝗗𝗔𝗜 𝗡𝗢𝗠𝗕𝗢𝗥 𝗚𝗘𝗟𝗔𝗣: 𝗧𝗘𝗣𝗔𝗧! 」
├ 🎯 𝗧𝗲𝗸𝗮𝗮𝗻 𝗞𝗮𝘂 : [ ${formatTekaan} ]
├ 🎲 𝗡𝗼𝗺𝗯𝗼𝗿 𝗡𝗮𝗶𝗸 : [ ${formatKeluar} ]
├ 💵 𝗧𝗮𝗿𝘂𝗵𝗮𝗻    : RM ${taruhan.toLocaleString()}
├ 💰 𝗛𝗮𝗱𝗶𝗮𝗵 (𝘅𝟮𝟬): +RM ${hadiah.toLocaleString()}
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "MAMPUUSSS kena nombor ekor! Malam ni tidur atas timbunan duit la nampaknya!"`;
            return sock.sendMessage(jid, { text: responTepat }, { quoted: m });
        } else {
            await db.saveUser(user);

            const responSalah = `
┌───「 🎟️ 𝗞𝗘𝗗𝗔𝗜 𝗡𝗢𝗠𝗕𝗢𝗥 𝗚𝗘𝗟𝗔𝗣: 𝗞𝗨𝗟𝗜𝗧 」
├ 🎯 𝗧𝗲𝗸𝗮𝗮𝗻 𝗞𝗮𝘂 : [ ${formatTekaan} ]
├ 🎲 𝗡𝗼𝗺𝗯𝗼𝗿 𝗡𝗮𝗶𝗸 : [ ${formatKeluar} ]
├ 💸 𝗟𝗲𝗯𝘂        : -RM ${taruhan.toLocaleString()}
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "Mimpi apa semalam tikam nombor tu? Jauh bebenor larinya hahahaha!"`;
            return sock.sendMessage(jid, { text: responSalah }, { quoted: m });
        }
    }
};
