export default {
    name: 'sabung_ayam',
    alias: ['sabung', 'laga_ayam'],
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const args = teks.trim().split(' ').slice(1);

        if (user.jail?.status && Date.now() < user.jail.release_at) {
            return sock.sendMessage(jid, { text: '⛓️ Awak dalam lokap, jangan sibuk nak menyabung ayam!' }, { quoted: m });
        }

        let taruhan = parseInt(args[0]);
        if (!taruhan || isNaN(taruhan) || taruhan <= 0) {
            return sock.sendMessage(jid, { 
                text: '❌ Masukkan taruhan! Contoh: `.sabung_ayam 1000`' 
            }, { quoted: m });
        }

        if (user.wallet < taruhan) {
            return sock.sendMessage(jid, { 
                text: `❌ Duit poket awak tak cukup taruhan RM ${taruhan.toLocaleString()}!` 
            }, { quoted: m });
        }

        const bakaAyamKita = [
            { nama: "Jalak Lentik Ekor Merah", taji: 75 },
            { nama: "Biring Kuning Taji Besi", taji: 85 },
            { nama: "Ayam Hutan Kelabu Asap", taji: 65 },
            { nama: "Katak Puru Kaki Kontot", taji: 40 }
        ];

        const bakaAyamMusuh = [
            { nama: "Siam Hitam Jarum Emas", taji: 70 },
            { nama: "Ayam Kampung Suspek Curi Jagung", taji: 50 },
            { nama: "Rintik Emas Tok Bilal", taji: 80 },
            { nama: "Jaguh Balung Terbelah", taji: 90 }
        ];

        const ayamKita = bakaAyamKita[Math.floor(Math.random() * bakaAyamKita.length)];
        const ayamMusuh = bakaAyamMusuh[Math.floor(Math.random() * bakaAyamMusuh.length)];

        // Kira skor pertarungan (Taji + Rawak nasib)
        const skorKita = ayamKita.taji + Math.floor(Math.random() * 40);
        const skorMusuh = ayamMusuh.taji + Math.floor(Math.random() * 40);

        user.wallet -= taruhan;

        // Ada risiko 10% serbuan polis dekat gelanggang sabung
        const serbuanPolis = Math.random() < 0.10;
        if (serbuanPolis) {
            user.jail.status = true;
            user.jail.release_at = Date.now() + (3 * 60 * 1000); // 3 minit lokap
            user.jail.reason = "Judi Sabung Ayam Haram Belakang Sawit";
            await db.saveUser(user);

            const responSerbu = `
┌───「 🚨 𝗦𝗘𝗥𝗕𝗨𝗔𝗡 𝗣𝗢𝗟𝗜𝗦: 𝗚𝗘𝗟𝗔𝗡𝗚𝗚𝗔𝗡𝗚 𝗟𝗜𝗡𝗚𝗞𝗨𝗣 」
├ 📍 𝗟𝗼𝗸𝗮𝘀𝗶 : Belakang Kebun Kelapa Sawit
├ 👮 𝗞𝗲𝘀    : Pasukan Gerakan Am serbu keliling pagar dawai!
├ 🐓 𝗔𝘆𝗮𝗺   : Semua ayam laga kena sita masuk lori.
├ 💸 𝗧𝗮𝗿𝘂𝗵𝗮𝗻 : -RM ${taruhan.toLocaleString()} (Hangus)
├ ⏳ 𝗟𝗼𝗸𝗮𝗽  : 3 Minit
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "Lari lintang pukang selipar tercabut! Balai tempat awak malam ni."`;
            return sock.sendMessage(jid, { text: responSerbu }, { quoted: m });
        }

        if (skorKita > skorMusuh) {
            const menang = taruhan * 2;
            user.wallet += menang;
            await db.saveUser(user);

            const aksiMenang = [
                "Ayam awak terbang libas taji tepat kena balung lawan!",
                "Sekali patuk, ayam musuh terus lari melompat keluar gelanggang!",
                "Serangan taji berputar buat ayam musuh tersungkur tepi reban!"
            ];
            const aksi = aksiMenang[Math.floor(Math.random() * aksiMenang.length)];

            const responMenang = `
┌───「 🐓 𝗦𝗔𝗕𝗨𝗡𝗚 𝗔𝗬𝗔𝗠: 𝗠𝗘𝗡𝗔𝗡𝗚! 」
├ 🥊 𝗔𝘆𝗮𝗺 𝗞𝗮𝘂  : ${ayamKita.nama} (Kuasa: ${skorKita})
├ 🆚 𝗔𝘆𝗮𝗺 𝗟𝗮𝘄𝗮𝗻: ${ayamMusuh.nama} (Kuasa: ${skorMusuh})
├ 💥 𝗔𝗸𝘀𝗶      : ${aksi}
├ 💵 𝗧𝘂𝗻𝗮𝗶     : +RM ${menang.toLocaleString()} (Untung Berganda)
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "Garang ayam awak! Balik ni bagi makan beras wangi sikit tanda hargai jasa dia."`;

            return sock.sendMessage(jid, { text: responMenang }, { quoted: m });
        } else {
            await db.saveUser(user);

            const aksiKalah = [
                "Ayam awak baru dengar kokok musuh dah lari menyusup celah kangkang penonton.",
                "Kena sepakan taji bertubi-tubi sampai gugur separuh bulu ekor!",
                "Ayam awak merajuk duduk tepi makan cacing, malas nak lawan."
            ];
            const aksi = aksiKalah[Math.floor(Math.random() * aksiKalah.length)];

            const responKalah = `
┌───「 🍂 𝗦𝗔𝗕𝗨𝗡𝗚 𝗔𝗬𝗔𝗠: 𝗧𝗘𝗪𝗔𝗦 」
├ 🥊 𝗔𝘆𝗮𝗺 𝗞𝗮𝘂  : ${ayamKita.nama} (Kuasa: ${skorKita})
├ 🆚 𝗔𝘆𝗮𝗺 𝗟𝗮𝘄𝗮𝗻: ${ayamMusuh.nama} (Kuasa: ${skorMusuh})
├ 💥 𝗔𝗸𝘀𝗶      : ${aksi}
├ 💸 𝗟𝗲𝗯𝘂      : -RM ${taruhan.toLocaleString()}
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "Hahaha baka ayam pencen mana awak pungut ni? Baik buat sup ayam je esok!"`;

            return sock.sendMessage(jid, { text: responKalah }, { quoted: m });
        }
    }
};
