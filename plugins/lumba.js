const cooldownLumba = new Map();

export default {
    name: 'lumba',
    alias: ['race', 'drag'],
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const senderId = m.key.participant || m.key.remoteJid;
        const now = Date.now();

        // Semak lokap
        if (user.jail?.status && now < user.jail.release_at) {
            return sock.sendMessage(jid, { text: '⛓️ Awak kena kurung dalam lokap trafik, jangan buat hal!' }, { quoted: m });
        }

        // Semak jentera
        if (!user.vehicle || user.vehicle.speed <= 10) {
            return sock.sendMessage(jid, { 
                text: '❌ Awak nak lumba lari kaki ayam ke? Pergi beli jentera kat `.showroom` dulu!' 
            }, { quoted: m });
        }

        // Cooldown 2 minit setiap lumba
        const COOLDOWN_LUMBA = 2 * 60 * 1000;
        const lastRace = cooldownLumba.get(senderId) || 0;
        if (now - lastRace < COOLDOWN_LUMBA) {
            const bakiSaat = Math.ceil((COOLDOWN_LUMBA - (now - lastRace)) / 1000);
            return sock.sendMessage(jid, { 
                text: `⏳ Enjin tengah panas gila tu! Tunggu radiator sejuk ${bakiSaat} saat lagi.` 
            }, { quoted: m });
        }

        const taruhan = 1000;
        if (user.wallet < taruhan) {
            return sock.sendMessage(jid, { 
                text: `❌ Perlukan tunai taruhan RM ${taruhan.toLocaleString()} dalam poket untuk masuk grid pelepasan!` 
            }, { quoted: m });
        }

        const trekLumba = [
            {
                nama: "Karak Highway (Menghala ke Terowong)",
                musuh: "Myvi Hitam Lampu Tinggi",
                speedMusuh: 80,
                ganjaran: 3000,
                ceritaMenang: "Awak potong celah lori kontena tepat sebelum selekoh tajam!",
                ceritaKalah: "Kena cucuk rapat dari belakang sampai terbabas tepi longkang."
            },
            {
                nama: "Downhill Bukit Ampang (Port Selekoh Maut)",
                musuh: "Satria GTI Ekzos Paip Perang",
                speedMusuh: 65,
                ganjaran: 2400,
                ceritaMenang: "Teknik 'gutter run' awak menjadi, tinggal musuh berkepul asap!",
                ceritaKalah: "Tayar belakang hilang cengkaman, spin 360 darjah depan gerai jagung bakar."
            },
            {
                nama: "Litar Lurus Dataran Merdeka (Sprint Malam)",
                musuh: "Wira Turbo Piston Pecah",
                speedMusuh: 50,
                ganjaran: 2000,
                ceritaMenang: "Gear 4 masuk padu tanpa miss! Duit taruhan selamat disapu.",
                ceritaKalah: "Musuh tekan NOS tiba-tiba potong garisan penamat separuh tiang."
            }
        ];

        const trek = trekLumba[Math.floor(Math.random() * trekLumba.length)];
        
        // Kira peratus kemenangan berdasarkan kelajuan jentera
        const totalKelajuan = user.vehicle.speed + Math.floor(Math.random() * 30);
        const musuhKelajuan = trek.speedMusuh + Math.floor(Math.random() * 30);

        // Ada risiko 15% polis buat Ops Samseng Jalanan
        const adaOpsPolis = Math.random() < 0.15;

        user.wallet -= taruhan;
        cooldownLumba.set(senderId, now);

        if (adaOpsPolis) {
            user.jail.status = true;
            user.jail.release_at = now + (4 * 60 * 1000); // 4 minit lokap
            user.jail.reason = "Ops Samseng Jalanan Bukit Aman";
            await db.saveUser(user);

            const responPolis = `
┌───「 🚨 𝗢𝗣𝗦 𝗦𝗔𝗠𝗦𝗘𝗡𝗚 𝗝𝗔𝗟𝗔𝗡𝗔𝗡: 𝗞𝗔𝗡𝗧𝗢𝗜 」
├ 📍 𝗧𝗿𝗲𝗸   : ${trek.nama}
├ 🚔 𝗦𝗲𝗿𝗯𝘂𝗮𝗻 : JPJ & Polis Trafik dah pasang roadblock kedua-dua hala!
├ 💸 𝗧𝗮𝗿𝘂𝗵𝗮𝗻 : -RM ${taruhan.toLocaleString()} (Hangus)
├ ⏳ 𝗛𝘂𝗸𝘂𝗺𝗮𝗻 : 4 Minit Lokap
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "Hahaha tengah syok layan corner terus kena tahan abang JPJ. Padan muka!"`;
            return sock.sendMessage(jid, { text: responPolis }, { quoted: m });
        }

        if (totalKelajuan > musuhKelajuan) {
            user.wallet += trek.ganjaran;
            user.stats.race_win = (user.stats.race_win || 0) + 1;
            await db.saveUser(user);

            const responMenang = `
┌───「 🏁 𝗞𝗘𝗣𝗨𝗧𝗨𝗦𝗔𝗡 𝗟𝗨𝗠𝗕𝗔: 𝗝𝗨𝗔𝗥𝗔! 」
├ 📍 𝗧𝗿𝗲𝗸    : ${trek.nama}
├ 🚘 𝗝𝗲𝗻𝘁𝗲𝗿𝗮 : ${user.vehicle.name} (${totalKelajuan} Km/j)
├ 🆚 𝗠𝘂𝘀𝘂𝗵   : ${trek.musuh} (${musuhKelajuan} Km/j)
├ 💵 𝗛𝗮𝘀𝗶𝗹   : +RM ${trek.ganjaran.toLocaleString()}
├ 📝 𝗖𝗮𝘁𝗮𝘁𝗮𝗻 : ${trek.ceritaMenang}
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "Fuh padu jentera awak harini! Dah boleh buka bengkel sendiri nampak gaya."`;
            return sock.sendMessage(jid, { text: responMenang }, { quoted: m });
        } else {
            user.stats.race_lose = (user.stats.race_lose || 0) + 1;
            await db.saveUser(user);

            const responKalah = `
┌───「 💨 𝗞𝗘𝗣𝗨𝗧𝗨𝗦𝗔𝗡 𝗟𝗨𝗠𝗕𝗔: 𝗧𝗘𝗪𝗔𝗦 」
├ 📍 𝗧𝗿𝗲𝗸    : ${trek.nama}
├ 🚘 𝗝𝗲𝗻𝘁𝗲𝗿𝗮 : ${user.vehicle.name} (${totalKelajuan} Km/j)
├ 🆚 𝗠𝘂𝘀𝘂𝗵   : ${trek.musuh} (${musuhKelajuan} Km/j)
├ 💸 𝗟𝗲𝗯𝘂    : -RM ${taruhan.toLocaleString()}
├ 📝 𝗖𝗮𝘁𝗮𝘁𝗮𝗻 : ${trek.ceritaKalah}
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "Kena tapau dengan musuh ke tu? Pergi upgrade jentera dulu la bro!"`;
            return sock.sendMessage(jid, { text: responKalah }, { quoted: m });
        }
    }
};
