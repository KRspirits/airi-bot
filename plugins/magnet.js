const cooldownMagnet = new Map();

export default {
    name: 'baling_magnet',
    alias: ['magnet', 'jual_besi', 'buka_peti'],
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const senderId = m.key.participant || m.key.remoteJid;
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const commandUsed = teks.slice(1).trim().split(' ')[0].toLowerCase();
        const now = Date.now();

        // 1. JUAL BESI BURUK (.jual_besi)
        if (commandUsed === 'jual_besi') {
            const beratBesi = user.inventory.scrap_metal || 0;
            if (beratBesi <= 0) {
                return sock.sendMessage(jid, { 
                    text: '❌ Kau takde besi buruk pun! Pergi baling magnet kat dasar sungai dulu.' 
                }, { quoted: m });
            }

            const hargaSekilo = 15; // RM15 per KG
            const jumlahTunai = beratBesi * hargaSekilo;

            user.wallet += jumlahTunai;
            user.inventory.scrap_metal = 0;
            await db.saveUser(user);

            const responJualBesi = `
┌───「 🏗️ 𝗞𝗜𝗟𝗔𝗡𝗚 𝗕𝗘𝗦𝗜 𝗕𝗨𝗥𝗨𝗞 𝗞𝗟𝗔𝗡𝗚 」
├ ⚖️ 𝗕𝗲𝗿𝗮𝘁 𝗗𝗶𝘁𝗶𝗺𝗯𝗮𝗻𝗴 : ${beratBesi} KG
├ 💵 𝗛𝗮𝗿𝗴𝗮 𝗦𝗲𝗺𝗮𝘀𝗮   : RM ${hargaSekilo} / KG
├ 💰 𝗧𝘂𝗻𝗮𝗶 𝗗𝗶𝘁𝗲𝗿𝗶𝗺𝗮  : +RM ${jumlahTunai.toLocaleString()}
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "Fuh mantap tokey besi buruk! Banyak modal nak modified kereta lepas ni."`;

            return sock.sendMessage(jid, { text: responJualBesi }, { quoted: m });
        }

        // 2. BUKA PETI MISTERI (.buka_peti)
        if (commandUsed === 'buka_peti') {
            const petiAda = user.inventory.mystery_box || 0;
            if (petiAda <= 0) {
                return sock.sendMessage(jid, { 
                    text: '❌ Kau takde Peti Besi Misteri! Tarik magnet kat jeti dulu mana tau ada rezeki tersangkut.' 
                }, { quoted: m });
            }

            user.inventory.mystery_box -= 1;

            // Hadiah rawak dalam peti
            const isiPeti = [
                { item: "Seguni Duit Syiling Lama 50 Sen Belah", cash: 3500, desc: "Syiling lama zaman kolonial bernilai tinggi." },
                { item: "Ketulan Emas Padu Dasar Sungai", cash: 8000, desc: "Ketulan emas berkilau tak berkarat langsung!" },
                { item: "Pistol Revolver Karat & Peluru Basah", cash: 800, desc: "Senjata terbuang kes rompakan zaman 90-an." },
                { item: "Sampah Lumpur & Kulit Kerang", cash: 50, desc: "Takde apa bernilai, sekadar lumpur hitam masin." }
            ];

            const loot = isiPeti[Math.floor(Math.random() * isiPeti.length)];
            user.wallet += loot.cash;
            await db.saveUser(user);

            const responPeti = `
┌───「 🔓 𝗞𝗨𝗡𝗖𝗜 𝗣𝗘𝗧𝗜 𝗕𝗘𝗦𝗜 𝗗𝗜𝗕𝗨𝗞𝗔 」
├ 📦 𝗜𝘀𝗶 𝗣𝗲𝘁𝗶  : ${loot.item}
├ 💵 𝗡𝗶𝗹𝗮𝗶     : +RM ${loot.cash.toLocaleString()}
├ 📝 𝗞𝗲𝘁𝗲𝗿𝗮𝗻𝗴𝗮𝗻: ${loot.desc}
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "Wahh nasib kau baik bukak peti ni! Ingat ada bom tadi."`;

            return sock.sendMessage(jid, { text: responPeti }, { quoted: m });
        }

        // 3. AKTIVITI BALING MAGNET (.baling_magnet)
        if (user.jail?.status && now < user.jail.release_at) {
            return sock.sendMessage(jid, { text: '⛓️ Kau dalam lokap! Jangan nak baling besi merata.' }, { quoted: m });
        }

        const COOLDOWN_MAGNET = 45 * 1000; // 45 saat
        const lastMagnet = cooldownMagnet.get(senderId) || 0;
        if (now - lastMagnet < COOLDOWN_MAGNET) {
            const bakiSaat = Math.ceil((COOLDOWN_MAGNET - (now - lastMagnet)) / 1000);
            return sock.sendMessage(jid, { 
                text: `⏳ Tali magnet tengah basah kuyup! Jemur dulu lagi ${bakiSaat} saat.` 
            }, { quoted: m });
        }

        cooldownMagnet.set(senderId, now);

        // Peluang dapat peti misteri (15%)
        const dapatPeti = Math.random() < 0.15;

        if (dapatPeti) {
            user.inventory.mystery_box = (user.inventory.mystery_box || 0) + 1;
            await db.saveUser(user);

            const responPetiDapat = `
┌───「 🧲 𝗧𝗔𝗥𝗜𝗞𝗔𝗡 𝗠𝗔𝗚𝗡𝗘𝗧: 𝗝𝗔𝗖𝗞𝗣𝗢𝗧! 」
├ 📦 𝗛𝗮𝘀𝗶𝗹  : 1x Peti Besi Misteri Air Masin!
├ 🔒 𝗦𝘁𝗮𝘁𝘂𝘀 : Terkunci Rapat
└───────────────────────────
Guna arahan \`.buka_peti\` untuk umpil kunci peti ni!
💬 𝗔𝗶𝗿𝗶: "Wehh berat gila benda melekat kat magnet kau tu! Buka cepat tengok apa kat dalam!"`;

            return sock.sendMessage(jid, { text: responPetiDapat }, { quoted: m });
        }

        // Tarikan biasa (Besi Buruk)
        const kutipBesi = [
            { item: "Sport Rim Motosikal EX5 Bengkok", kg: 8 },
            { item: "Pintu Peti Ais Lama Karat", kg: 25 },
            { item: "Rangka Basikal Chopper Patah", kg: 14 },
            { item: "Tin Minyak Pelincir Hitam", kg: 3 }
        ];

        const besi = kutipBesi[Math.floor(Math.random() * kutipBesi.length)];
        user.inventory.scrap_metal = (user.inventory.scrap_metal || 0) + besi.kg;
        await db.saveUser(user);

        const responBesi = `
┌───「 🧲 𝗧𝗔𝗥𝗜𝗞𝗔𝗡 𝗠𝗔𝗚𝗡𝗘𝗧: 𝗕𝗘𝗥𝗝𝗔𝗬𝗔 」
├ 🔩 𝗕𝗮𝗿𝗮𝗻𝗴 : ${besi.item}
├ ⚖️ 𝗕𝗲𝗿𝗮𝘁  : +${besi.kg} KG Besi Buruk
├ 📊 𝗧𝗼𝘁𝗮𝗹  : ${(user.inventory.scrap_metal).toLocaleString()} KG Dalam Simpanan
└───────────────────────────
Guna arahan \`.jual_besi\` untuk timbang kat kilang besi.
💬 𝗔𝗶𝗿𝗶: "Kemas bro, kutip besi banyak-banyak boleh tolong bersihkan sungai sekali."`;

        return sock.sendMessage(jid, { text: responBesi }, { quoted: m });
    }
};
