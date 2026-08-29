const SPESIES_DATABASE = [
    // Biasa & Muara
    { id: 'f1', name: "Ikan Puyu Sawah", price: 80, tier: "Common", buff: { type: 'gaji', val: 10 } },
    { id: 'f2', name: "Ikan Haruan Lembab", price: 180, tier: "Common", buff: { type: 'gaji', val: 20 } },
    { id: 'f3', name: "Ikan Kelisa Emas", price: 2500, tier: "Epic", buff: { type: 'gaji', val: 80 } },
    { id: 'f4', name: "Kelah Merah Titiwangsa", price: 8500, tier: "Legendary", buff: { type: 'speed', val: 15 } },
    { id: 'f5', name: "Toman Bunga Gergasi", price: 4000, tier: "Epic", buff: { type: 'denda', val: 10 } },
    // Monster Purba & Mitos
    { id: 'm1', name: "Buaya Tembaga Muara", price: 80000, tier: "Mythic", danger: true, buff: { type: 'denda', val: 30 } },
    { id: 'm2', name: "Ikan Purba Coelacanth", price: 350000, tier: "Mythic", danger: false, buff: { type: 'gaji', val: 300 } },
    { id: 'm3', name: "Naga Tasik Chini", price: 2500000, tier: "Divine", danger: true, buff: { type: 'speed', val: 50 } }
];

const cdPancing = new Map();

export default {
    name: 'mancing',
    alias: ['fish', 'jual_ikan', 'bela_ikan', 'akuarium', 'jual_akuarium'],
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const senderId = m.key.participant || jid;
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const commandUsed = teks.slice(1).trim().split(' ')[0].toLowerCase();
        const args = teks.trim().split(' ').slice(1);
        const now = Date.now();

        // 1. LIHAT AKUARIUM & BUFF (.akuarium)
        if (commandUsed === 'akuarium') {
            const list = user.aquarium || [];
            if (list.length === 0) {
                return sock.sendMessage(jid, { text: '🐟 Balang akuarium kau kosong! Taip `.bela_ikan` lepas pancing.' }, { quoted: m });
            }

            let str = `┌───「 🐠 𝗣𝗘𝗡𝗚𝗨𝗥𝗨𝗦𝗔𝗡 𝗔𝗞𝗨𝗔𝗥𝗜𝗨𝗠 」\n│ _Ikan peliharaan memberi buff pasif kekal:_\n├───────────────────────────\n`;
            list.forEach((ik, i) => {
                str += `├ ${i + 1}. *${ik.name}* [${ik.tier}]\n│   └ Buff: +${ik.buff_val}% ${ik.buff_type}\n`;
            });
            str += `└───────────────────────────\nTaip \`.jual_akuarium\` untuk cairkan semua ikan jadi wang tunai!`;
            return sock.sendMessage(jid, { text: str }, { quoted: m });
        }

        // 2. CAIRKAN AKUARIUM (.jual_akuarium)
        if (commandUsed === 'jual_akuarium') {
            const list = user.aquarium || [];
            if (list.length === 0) return sock.sendMessage(jid, { text: '❌ Tiada ikan dalam akuarium!' }, { quoted: m });

            let total = 0;
            list.forEach(i => total += (i.price || 500));
            user.wallet += total;
            user.aquarium = [];
            await db.saveUser(user);

            return sock.sendMessage(jid, { text: `💰 *AKUARIUM DILELONG!* Kau menerima *RM ${total.toLocaleString()}*!` }, { quoted: m });
        }

        // 3. JUAL SEMUA IKAN BIASA (.jual_ikan)
        if (commandUsed === 'jual_ikan') {
            const fishes = user.inventory.fish || [];
            if (fishes.length === 0) return sock.sendMessage(jid, { text: '❌ Tong ikan kau kosong!' }, { quoted: m });

            let profit = 0;
            fishes.forEach(f => profit += f.price);
            user.wallet += profit;
            user.inventory.fish = [];
            await db.saveUser(user);

            return sock.sendMessage(jid, { text: `💵 Semua ikan terjual! Berjaya meraih *+RM ${profit.toLocaleString()}*!` }, { quoted: m });
        }

        // 4. MASUKKAN KE AKUARIUM (.bela_ikan)
        if (commandUsed === 'bela_ikan') {
            const fishes = user.inventory.fish || [];
            if (fishes.length === 0) return sock.sendMessage(jid, { text: '❌ Tiada ikan baru ditangkap untuk dibela!' }, { quoted: m });

            const lastCatch = fishes.pop(); // Ambil tangkapan terakhir
            if ((user.aquarium || []).length >= 5) {
                return sock.sendMessage(jid, { text: '❌ Akuarium dah penuh (Maksimum 5 ekor)! Taip `.jual_akuarium` dulu.' }, { quoted: m });
            }

            user.aquarium.push({
                id: lastCatch.id,
                name: lastCatch.name,
                tier: lastCatch.tier,
                price: lastCatch.price,
                buff_type: lastCatch.buff.type,
                buff_val: lastCatch.buff.val
            });
            await db.saveUser(user);

            return sock.sendMessage(jid, {
                text: `🐠 *IKAN DILEPASKAN KE AKUARIUM!*\n*${lastCatch.name}* kini aktif memberikan pasif buff *+${lastCatch.buff.val}% ${lastCatch.buff.type}*!`
            }, { quoted: m });
        }

        // 5. PROSES PANCING (JETI 2.0)
        if (user.jail?.status && now < user.jail.release_at) {
            return sock.sendMessage(jid, { text: '⛓️ Kau dalam lokap/wad hospital, tak boleh pancing!' }, { quoted: m });
        }

        const cd = 45 * 1000;
        const last = cdPancing.get(senderId) || 0;
        if (now - last < cd) {
            return sock.sendMessage(jid, { text: `⏳ Ikan belum timbul, tunggu ${Math.ceil((cd - (now - last)) / 1000)} saat!` }, { quoted: m });
        }
        cdPancing.set(senderId, now);

        const tangkapan = SPESIES_DATABASE[Math.floor(Math.random() * SPESIES_DATABASE.length)];

        // Mekanik Bahaya: Pemangsa Mencederakan Pemain
        if (tangkapan.danger && Math.random() < 0.40) {
            user.jail.status = true;
            user.jail.release_at = now + (5 * 60 * 1000);
            user.jail.reason = `Diserang dan dibaham oleh ${tangkapan.name}`;
            await db.saveUser(user);

            return sock.sendMessage(jid, {
                text: `
┌───「 🚨 𝗕𝗔𝗛𝗔𝗬𝗔 𝗠𝗨𝗔𝗥𝗔: 𝗧𝗘𝗥𝗖𝗘𝗗𝗘𝗥𝗔 」
├ 👾 𝗣𝗲𝗺𝗮𝗻𝗴𝘀𝗮 : ${tangkapan.name}
├ 🩸 𝗞𝗲𝘀      : Ekor libas bot terbalik dan kau diseret ke dasar!
├ 🏥 𝗛𝗼𝘀𝗽𝗶𝘁𝗮𝗹 : Dikejarkan ke wad kecemasan (5 Minit)!
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "Kan dah pesan jangan gatal pancing dekat lubuk naga/buaya! Selamat bernafas dalam wad."`
            }, { quoted: m });
        }

        user.inventory.fish.push(tangkapan);
        user.stats.fish_caught = (user.stats.fish_caught || 0) + 1;
        await db.saveUser(user);

        return sock.sendMessage(jid, {
            text: `
┌───「 🎣 𝗝𝗘𝗧𝗜 𝗠𝗘𝗠𝗔𝗡𝗖𝗜𝗡𝗚 𝟮.𝟬: 𝗦𝗧𝗥𝗜𝗞𝗘! 」
├ 🐟 𝗦𝗽𝗲𝘀𝗶𝗲𝘀  : ${tangkapan.name}
├ 🏷️ 𝗧𝗶𝗲𝗿     : [ ${tangkapan.tier} ]
├ 💵 𝗡𝗶𝗹𝗮𝗶    : RM ${tangkapan.price.toLocaleString()}
├ ✨ 𝗕𝘂𝗳𝗳     : +${tangkapan.buff.val}% ${tangkapan.buff.type}
└───────────────────────────
Pilihan tindakan:
1. Taip \`.jual_ikan\` untuk ambil tunai segera.
2. Taip \`.bela_ikan\` untuk simpan di akuarium dan aktifkan buff pasif!`
        }, { quoted: m });
    }
};
