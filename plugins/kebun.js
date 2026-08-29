const TANAMAN = {
    cili: { name: 'Cili Bara Fertigasi 🌶️', price: 1000, growTime: 60 * 1000, returnMin: 2200, returnMax: 3500, illegal: false },
    strawberi: { name: 'Strawberi Cameron Highlands 🍓', price: 3000, growTime: 2 * 60 * 1000, returnMin: 6500, returnMax: 9500, illegal: false },
    ketum: { name: 'Daun Ubat Tradisional Hijau 🍃', price: 5000, growTime: 90 * 1000, returnMin: 15000, returnMax: 28000, illegal: true }
};

export default {
    name: 'kebun',
    alias: ['tanam', 'tuai'],
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const args = teks.trim().split(' ').slice(1);
        const cmd = teks.slice(1).trim().split(' ')[0].toLowerCase();
        const now = Date.now();

        // 1. TUAI HASIL TANAMAN (.tuai)
        if (cmd === 'tuai') {
            if (!user.farm || !user.farm.crop) {
                return sock.sendMessage(jid, { text: '❌ Petak kebun kau kosong! Tanam benih guna `.tanam [cili/strawberi/ketum]`.' }, { quoted: m });
            }

            if (now < user.farm.harvest_at) {
                const bakiSaat = Math.ceil((user.farm.harvest_at - now) / 1000);
                return sock.sendMessage(jid, { text: `⏳ Tanaman belum matang! Tunggu lagi ${bakiSaat} saat untuk dituai.` }, { quoted: m });
            }

            const info = TANAMAN[user.farm.crop];

            // Risiko Serbuan AADK jika tanaman haram (30% kebarangkalian)
            if (info.illegal && Math.random() < 0.30) {
                user.farm.crop = null;
                user.jail.status = true;
                user.jail.release_at = now + (4 * 60 * 1000);
                user.jail.reason = "Membina Ladang Bahan Terlarang";
                await db.saveUser(user);

                return sock.sendMessage(jid, {
                    text: `🚨 *SERBUAN DRON PENGUATKUASA!*\nLadang daun hijau kau dikesan dari udara! Semua pokok ditebas dan kau disumbat ke lokap (4 Minit)!`
                }, { quoted: m });
            }

            const untung = Math.floor(Math.random() * (info.returnMax - info.returnMin + 1)) + info.returnMin;
            user.wallet += untung;
            user.farm.crop = null;
            await db.saveUser(user);

            return sock.sendMessage(jid, {
                text: `
┌───「 🌾 𝗛𝗔𝗦𝗜𝗟 𝗧𝗨𝗔𝗜𝗔𝗡 𝗞𝗘𝗕𝗨𝗡 」
├ 📦 𝗧𝗮𝗻𝗮𝗺𝗮𝗻 : ${info.name}
├ 💵 𝗣𝘂𝗹𝗮𝗻𝗴𝗮𝗻 : +RM ${untung.toLocaleString()} Masuk Poket!
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "Subur betul tanaman kau! Dapat duit bersih hasil tanah."`
            }, { quoted: m });
        }

        // 2. PILIH BENIH TANAMAN (.tanam [jenis])
        if (cmd === 'tanam') {
            const benih = args[0]?.toLowerCase();
            const target = TANAMAN[benih];

            if (!target) {
                return sock.sendMessage(jid, {
                    text: `🌱 *SENARAI BENIH TANAMAN:*\n1. \`.tanam cili\` (Modal RM1,000 | 1 Minit)\n2. \`.tanam strawberi\` (Modal RM3,000 | 2 Minit)\n3. \`.tanam ketum\` (Modal RM5,000 | Untung Melampau | Risiko Serbuan)\n\nTaip \`.tanam [nama]\` untuk menanam!`
                }, { quoted: m });
            }

            if (user.farm && user.farm.crop) {
                return sock.sendMessage(jid, { text: `❌ Kebun masih ada tanaman *${TANAMAN[user.farm.crop].name}*! Taip \`.tuai\` dahulu.` }, { quoted: m });
            }

            if (user.wallet < target.price) {
                return sock.sendMessage(jid, { text: `❌ Modal tak cukup RM ${target.price.toLocaleString()} untuk beli benih dan baja!` }, { quoted: m });
            }

            user.wallet -= target.price;
            user.farm = {
                crop: benih,
                planted_at: now,
                harvest_at: now + target.growTime,
                is_illegal: target.illegal
            };
            await db.saveUser(user);

            return sock.sendMessage(jid, {
                text: `🌱 *BENIH TELAH DITABUR!*\nTanaman: *${target.name}*\nMasa Matang: *${target.growTime / 1000} Saat*\nTunggu masa tamat dan taip \`.tuai\`!`
            }, { quoted: m });
        }

        // 3. SEMAK STATUS KEBUN (.kebun)
        if (!user.farm || !user.farm.crop) {
            return sock.sendMessage(jid, { text: '🏡 Kebun kau sunyi sepi bertanah lapang. Taip `.tanam` untuk mula berkebun.' }, { quoted: m });
        }

        const info = TANAMAN[user.farm.crop];
        const statusTumbuh = now >= user.farm.harvest_at ? '✅ Sudah Matang (Sedia Dituai)' : `⏳ Membesar (${Math.ceil((user.farm.harvest_at - now)/1000)}s lagi)`;

        return sock.sendMessage(jid, {
            text: `🏡 *STATUS KEBUN ANDA*\nTanaman: ${info.name}\nStatus: ${statusTumbuh}\nTaip \`.tuai\` jika sudah matang!`
        }, { quoted: m });
    }
};
