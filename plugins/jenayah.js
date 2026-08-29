export default {
    name: 'jenayah',
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;

        // Semak rekod lokap
        if (user.jail.status) {
            if (Date.now() < user.jail.release_at) {
                const bakiMinit = Math.ceil((user.jail.release_at - Date.now()) / 60000);
                return sock.sendMessage(jid, { 
                    text: `⛓️ Duduk diam-diam dalam lokap tu! Ada baki lagi ${bakiMinit} minit.` 
                }, { quoted: m });
            } else {
                user.jail.status = false;
            }
        }

        const senario = [
            {
                lokasi: "Lorong Petaling Street",
                misi: "Rembat 5 kotak jam tangan ciplak gred 1:1 celah gerai payung",
                sukses: true,
                min: 800, max: 2000,
                cerita: "Kau licik menyusup waktu tokey gerai tengah kalut kemas payung hujan!",
                roast: "Amboi laju buat kerja, belanja kitorang teh tarik ais malam ni!"
            },
            {
                lokasi: "Highway Karak (Pemberhentian Lori)",
                misi: "Sedut minyak diesel dari lori treler muatan berat",
                sukses: false,
                penalti: 3 * 60 * 1000, // 3 minit
                cerita: "Tertelan hos diesel, pastu pemandu lori keluar pegang sepana saiz 32.",
                roast: "Hahaha telan diesel terus jadi enjin turbo ke bang? Rehat balai dulu!"
            },
            {
                lokasi: "Bukit Ampang (Port Lumba Haram)",
                misi: "Buka sport rim te37 dari Satria Neo yang tengah parking",
                sukses: true,
                min: 1500, max: 3500,
                cerita: "Sempat buka semua nut sebelum anjing liar kawasan tu menyalak!",
                roast: "Rim orang kau kebas, tapi balik naik jalan kaki jugak. Aduhai."
            },
            {
                lokasi: "Laluan Smart Tunnel KL",
                misi: "Kopek cermin van curi beg duit atas dashboard waktu jammed",
                sukses: false,
                penalti: 4 * 60 * 1000,
                cerita: "Lampu isyarat tiba-tiba hijau, van jalan laju dan kau disorot lampu tinggi Myvi King!",
                roast: "Acah nak jadi Fast & Furious, kan dah kena tapau dengan King jalanan."
            }
        ];

        const hasilRawak = senario[Math.floor(Math.random() * senario.length)];

        if (hasilRawak.sukses) {
            const dapat = Math.floor(Math.random() * (hasilRawak.max - hasilRawak.min + 1)) + hasilRawak.min;
            user.black_money += dapat;
            await db.saveUser(user);

            const respon = `
┌───「 🏴‍☠️ 𝗢𝗣𝗘𝗥𝗔𝗦𝗜 𝗚𝗘𝗟𝗔𝗣: 𝗦𝗘𝗧𝗧𝗟𝗘 」
├ 📍 𝗟𝗼𝗸𝗮𝘀𝗶 : ${hasilRawak.lokasi}
├ 🎯 𝗠𝗶𝘀𝗶   : ${hasilRawak.misi}
├ 💵 𝗛𝗮𝘀𝗶𝗹  : +RM ${dapat.toLocaleString()} (Duit Kotor)
├ 📝 𝗞𝗲𝘀    : ${hasilRawak.cerita}
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "${hasilRawak.roast}"`;
            return sock.sendMessage(jid, { text: respon }, { quoted: m });
        } else {
            user.jail.status = true;
            user.jail.release_at = Date.now() + hasilRawak.penalti;
            await db.saveUser(user);

            const respon = `
┌───「 🚨 𝗞𝗔𝗡𝗧𝗢𝗜 𝗕𝗔𝗦𝗔𝗛: 𝗟𝗢𝗞𝗔𝗣 」
├ 📍 𝗟𝗼𝗸𝗮𝘀𝗶 : ${hasilRawak.lokasi}
├ 🛑 𝗦𝗲𝗯𝗮𝗯  : ${hasilRawak.cerita}
├ ⏳ 𝗛𝘂𝗸𝘂𝗺𝗮𝗻: ${hasilRawak.penalti / 60000} Minit Lokap
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "${hasilRawak.roast}"`;
            return sock.sendMessage(jid, { text: respon }, { quoted: m });
        }
    }
};
