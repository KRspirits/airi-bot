export default {
    name: 'slot',
    alias: ['judi', 'spin'],
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const args = teks.trim().split(' ').slice(1);

        // Semak lokap
        if (user.jail?.status && Date.now() < user.jail.release_at) {
            return sock.sendMessage(jid, { text: '⛓️ Dalam lokap mana ada mesin slot mangkuk!' }, { quoted: m });
        }

        let taruhan = parseInt(args[0]);
        if (!taruhan || isNaN(taruhan) || taruhan <= 0) {
            return sock.sendMessage(jid, { 
                text: '❌ Masukkan taruhan! Contoh: `.slot 500`' 
            }, { quoted: m });
        }

        if (user.wallet < taruhan) {
            return sock.sendMessage(jid, { 
                text: `❌ Duit poket tak cukup nak main mesin! Awak cuma ada RM ${user.wallet.toLocaleString()}` 
            }, { quoted: m });
        }

        const simbol = ['🍇', '🍉', '🍊', '🔔', '💎', '7️⃣'];
        const roda1 = simbol[Math.floor(Math.random() * simbol.length)];
        const roda2 = simbol[Math.floor(Math.random() * simbol.length)];
        const roda3 = simbol[Math.floor(Math.random() * simbol.length)];

        user.wallet -= taruhan;

        // Situasi 1: Jackpot 777 (x10)
        if (roda1 === '7️⃣' && roda2 === '7️⃣' && roda3 === '7️⃣') {
            const menang = taruhan * 10;
            user.wallet += menang;
            await db.saveUser(user);

            const responJackpot = `
┌───「 🎰 𝗠𝗘𝗦𝗜𝗡 𝗦𝗟𝗢𝗧: 𝗝𝗔𝗖𝗞𝗣𝗢𝗧 𝟳𝟳𝟳! 」
│
│       [ ${roda1} | ${roda2} | ${roda3} ] 💥
│
├───「 𝗠𝗔𝗛𝗔 𝗞𝗘𝗥𝗔𝗠𝗔𝗧 」───────
├ 💵 𝗧𝗮𝗿𝘂𝗵𝗮𝗻 : RM ${taruhan.toLocaleString()}
├ 💰 𝗠𝗲𝗻𝗮𝗻𝗴  : +RM ${menang.toLocaleString()} (x10)
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "GILA BABI JACKPOT 777! Rezeki terpijak ke awak pakai minyak dagu ni?!"`;
            return sock.sendMessage(jid, { text: responJackpot }, { quoted: m });
        }

        // Situasi 2: 3 Simbol Sama Selain 777 (x4)
        if (roda1 === roda2 && roda2 === roda3) {
            const menang = taruhan * 4;
            user.wallet += menang;
            await db.saveUser(user);

            const responTigaSama = `
┌───「 🎰 𝗠𝗘𝗦𝗜𝗡 𝗦𝗟𝗢𝗧: 𝗠𝗘𝗡𝗔𝗡𝗚 𝗕𝗘𝗦𝗔𝗥 」
│
│       [ ${roda1} | ${roda2} | ${roda3} ] ✨
│
├───「 𝗞𝗘𝗣𝗨𝗧𝗨𝗦𝗔𝗡 」─────────
├ 💵 𝗧𝗮𝗿𝘂𝗵𝗮𝗻 : RM ${taruhan.toLocaleString()}
├ 💰 𝗠𝗲𝗻𝗮𝗻𝗴  : +RM ${menang.toLocaleString()} (x4)
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "Not bad, melekat tiga-tiga biji! Cuci duit cepat sebelum lesap balik."`;
            return sock.sendMessage(jid, { text: responTigaSama }, { quoted: m });
        }

        // Situasi 3: 2 Simbol Sama (x1.5 Pulang Modal Lebih)
        if (roda1 === roda2 || roda2 === roda3 || roda1 === roda3) {
            const menang = Math.floor(taruhan * 1.5);
            user.wallet += menang;
            await db.saveUser(user);

            const responDuaSama = `
┌───「 🎰 𝗠𝗘𝗦𝗜𝗡 𝗦𝗟𝗢𝗧: 𝗟𝗨𝗖𝗞𝗬 𝗗𝗢𝗨𝗕𝗟𝗘 」
│
│       [ ${roda1} | ${roda2} | ${roda3} ]
│
├───「 𝗞𝗘𝗣𝗨𝗧𝗨𝗦𝗔𝗡 」─────────
├ 💵 𝗧𝗮𝗿𝘂𝗵𝗮𝗻 : RM ${taruhan.toLocaleString()}
├ 💰 𝗣𝘂𝗹𝗮𝗻𝗴  : +RM ${menang.toLocaleString()}
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "Dua biji lekat. Ada la untung sikit buat topup kredit e-wallet awak tu."`;
            return sock.sendMessage(jid, { text: responDuaSama }, { quoted: m });
        }

        // Situasi 4: Kalah Sepenuhnya
        await db.saveUser(user);

        const roastsKalah = [
            "Hahaha lebur! Kan saya dah kata mesin ni makan duit.",
            "Tengok tu, licin! Baik awak guna duit tu sedekah kat tabung masjid.",
            "Seminit je duit RM " + taruhan.toLocaleString() + " jadi habuk. Padan muka!",
            "Jangan koyak bro, mesin tu yang problem bukan awak (tapi awak yang rugi HAHA)."
        ];
        const airiBahan = roastsKalah[Math.floor(Math.random() * roastsKalah.length)];

        const responKalah = `
┌───「 🎰 𝗠𝗘𝗦𝗜𝗡 𝗦𝗟𝗢𝗧: 𝗟𝗘𝗕𝗨𝗥 」
│
│       [ ${roda1} | ${roda2} | ${roda3} ] ❌
│
├───「 𝗞𝗘𝗣𝗨𝗧𝗨𝗦𝗔𝗡 」─────────
├ 💵 𝗧𝗮𝗿𝘂𝗵𝗮𝗻 : RM ${taruhan.toLocaleString()}
├ 💸 𝗞𝗲𝗿𝘂𝗴𝗶𝗮𝗻: -RM ${taruhan.toLocaleString()}
├ 💼 𝗕𝗮𝗸𝗶 𝗣𝗼𝗸𝗲𝘁: RM ${user.wallet.toLocaleString()}
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "${airiBahan}"`;

        return sock.sendMessage(jid, { text: responKalah }, { quoted: m });
    }
};
