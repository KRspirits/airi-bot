export default {
    name: 'jenayah',
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;

        // Pastikan format database wujud
        if (!user.jail) user.jail = { status: false, release_at: 0 };
        if (!user.inventory) user.inventory = {};
        if (!user.inventory.bm_buff) user.inventory.bm_buff = { nama: 'Tiada', perlindungan: 0 };

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
                misi: "Rembat 5 kotak jam tangan ciplak gred 1:1",
                peluangAsal: 0.60, // 60% chance berjaya tanpa buff
                min: 800, max: 2000,
                penalti: 2 * 60 * 1000,
                ceritaSukses: "Kau licik menyusup waktu tokey gerai tengah kalut kemas payung hujan!",
                ceritaGagal: "Kaki tersadung payung, tokey kejar bawa parang potong daging!",
                roast: "Amboi laju buat kerja, belanja kitorang teh tarik ais malam ni!"
            },
            {
                lokasi: "Highway Karak (Pemberhentian Lori)",
                misi: "Sedut minyak diesel dari lori treler",
                peluangAsal: 0.50, // 50% chance berjaya tanpa buff
                min: 1500, max: 3000,
                penalti: 3 * 60 * 1000,
                ceritaSukses: "Dapat sedut 3 tong diesel penuh tanpa sedarkan driver yang tengah tidur mati.",
                ceritaGagal: "Tertelan hos diesel, pastu pemandu lori keluar pegang sepana saiz 32.",
                roast: "Hahaha telan diesel terus jadi enjin turbo ke bang? Rehat balai dulu!"
            },
            {
                lokasi: "Bukit Ampang (Port Lumba Haram)",
                misi: "Buka sport rim te37 dari Satria Neo",
                peluangAsal: 0.40, // 40% chance berjaya tanpa buff
                min: 1500, max: 3500,
                penalti: 4 * 60 * 1000,
                ceritaSukses: "Sempat buka semua nut sebelum anjing liar kawasan tu menyalak!",
                ceritaGagal: "Tengah jack kereta, owner datang bawak geng lumba haram kepung kau.",
                roast: "Rim orang kau kebas, tapi balik naik jalan kaki jugak. Aduhai."
            },
            {
                lokasi: "Laluan Smart Tunnel KL",
                misi: "Kopek cermin van curi beg duit",
                peluangAsal: 0.35, // 35% chance berjaya tanpa buff
                min: 3000, max: 6000,
                penalti: 5 * 60 * 1000,
                ceritaSukses: "Cermin pecah senyap, sambar beg duit terus lari ikut laluan kecemasan!",
                ceritaGagal: "Lampu isyarat tiba-tiba hijau, van jalan laju dan kau disorot lampu tinggi Myvi King!",
                roast: "Acah nak jadi Fast & Furious, kan dah kena tapau dengan King jalanan."
            }
        ];

        // Pilih misi rawak & kira peluang berjaya bersama Buff Black Market
        const hasilRawak = senario[Math.floor(Math.random() * senario.length)];
        const buffBM = user.inventory.bm_buff.perlindungan;
        const peratusBerjaya = hasilRawak.peluangAsal + buffBM;

        const rng = Math.random();
        const isBerjaya = rng <= peratusBerjaya; // Lulus jika RNG lebih rendah/sama dengan peluang

        if (isBerjaya) {
            const dapat = Math.floor(Math.random() * (hasilRawak.max - hasilRawak.min + 1)) + hasilRawak.min;
            user.black_money = (user.black_money || 0) + dapat;
            
            if (typeof user.markModified === 'function') user.markModified('inventory');
            await db.saveUser(user);

            const respon = `
┌───「 🏴‍☠️ 𝗢𝗣𝗘𝗥𝗔𝗦𝗜 𝗚𝗘𝗟𝗔𝗣: 𝗦𝗘𝗧𝗧𝗟𝗘 」
├ 📍 𝗟𝗼𝗸𝗮𝘀𝗶 : ${hasilRawak.lokasi}
├ 🎯 𝗠𝗶𝘀𝗶   : ${hasilRawak.misi}
├ 🛡️ 𝗕𝘂𝗳𝗳 𝗕𝗠: ${user.inventory.bm_buff.nama} (+${buffBM * 100}%)
├ 💵 𝗛𝗮𝘀𝗶𝗹  : +RM ${dapat.toLocaleString()} (Duit Kotor)
├ 📝 𝗞𝗲𝘀    : ${hasilRawak.ceritaSukses}
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "${hasilRawak.roast}"`;
            return sock.sendMessage(jid, { text: respon.trim() }, { quoted: m });
        } else {
            user.jail.status = true;
            user.jail.release_at = Date.now() + hasilRawak.penalti;
            
            if (typeof user.markModified === 'function') user.markModified('inventory');
            await db.saveUser(user);

            const respon = `
┌───「 🚨 𝗞𝗔𝗡𝗧𝗢𝗜 𝗕𝗔𝗦𝗔𝗛: 𝗟𝗢𝗞𝗔𝗣 」
├ 📍 𝗟𝗼𝗸𝗮𝘀𝗶 : ${hasilRawak.lokasi}
├ 🛡️ 𝗕𝘂𝗳𝗳 𝗕𝗠: ${user.inventory.bm_buff.nama} (Gagal lindung)
├ 🛑 𝗦𝗲𝗯𝗮𝗯  : ${hasilRawak.ceritaGagal}
├ ⏳ 𝗛𝘂𝗸𝘂𝗺𝗮𝗻: ${hasilRawak.penalti / 60000} Minit Lokap
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "${hasilRawak.roast}"`;
            return sock.sendMessage(jid, { text: respon.trim() }, { quoted: m });
        }
    }
};
