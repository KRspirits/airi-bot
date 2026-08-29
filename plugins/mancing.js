const cooldownMancing = new Map();

export default {
    name: 'mancing',
    alias: ['fish', 'jual_ikan'],
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const senderId = m.key.participant || m.key.remoteJid;
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const commandUsed = teks.slice(1).trim().split(' ')[0].toLowerCase();
        const now = Date.now();

        // 1. JUAL SEMUA IKAN (.jual_ikan)
        if (commandUsed === 'jual_ikan') {
            if (!user.inventory.fish || user.inventory.fish.length === 0) {
                return sock.sendMessage(jid, { 
                    text: '❌ Bakul ikan kau kosong! Pergi pacak joran guna `.mancing` dulu.' 
                }, { quoted: m });
            }

            const totalIkan = user.inventory.fish.length;
            let totalNilai = 0;
            user.inventory.fish.forEach(f => totalNilai += f.price);

            user.wallet += totalNilai;
            user.inventory.fish = []; // Kosongkan bakul
            await db.saveUser(user);

            const responJual = `
┌───「 🐟 𝗣𝗘𝗠𝗕𝗢𝗥𝗢𝗡𝗚 𝗣𝗔𝗦𝗔𝗥 𝗕𝗔𝗦𝗔𝗛 」
├ 📦 𝗧𝗮𝗻𝗴𝗸𝗮𝗽𝗮𝗻 : ${totalIkan} Ekor Ikan
├ 💵 𝗧𝘂𝗻𝗮𝗶     : +RM ${totalNilai.toLocaleString()}
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "Alhamdulillah laku jugak ikan bau hanyir kau tu. Bolehlah belanja minum petang!"`;

            return sock.sendMessage(jid, { text: responJual }, { quoted: m });
        }

        // 2. AKTIVITI MEMANCING (.mancing)
        if (user.jail?.status && now < user.jail.release_at) {
            return sock.sendMessage(jid, { text: '⛓️ Kau dalam lokap, jangan berangan nak pegang joran!' }, { quoted: m });
        }

        const COOLDOWN_MANCING = 60 * 1000; // 1 minit cooldown
        const lastFish = cooldownMancing.get(senderId) || 0;
        if (now - lastFish < COOLDOWN_MANCING) {
            const bakiSaat = Math.ceil((COOLDOWN_MANCING - (now - lastFish)) / 1000);
            return sock.sendMessage(jid, { 
                text: `⏳ Ikan belum hidu umpan bro! Tunggu pelampung tenggelam lagi ${bakiSaat} saat.` 
            }, { quoted: m });
        }

        const senaraiIkan = [
            { name: "Ikan Keli Afrika Paya", weight: "1.2 KG", price: 60, tier: "Biasa", desc: "Keli lendir hitam tahan lasak.", roast: "Keli goreng berlada sedap ni weh." },
            { name: "Ikan Tilapia Merah", weight: "2.5 KG", price: 150, tier: "Biasa", desc: "Tangkapan standard kolam pancing air tawar.", roast: "Isi manis, boleh bawak balik goreng cicah kicap cili potong." },
            { name: "Siakap Muara Liar", weight: "4.8 KG", price: 450, tier: "Rare", desc: "Tarik kuat sampai melengkung hujung joran!", roast: "Siakap Tiga Rasa kayangan ni! Jual cepat sebelum busuk." },
            { name: "Ikan Kelah Merah Jeram", weight: "6.0 KG", price: 2200, tier: "Legenda", desc: "Raja sungai air jernih Banjaran Titiwangsa!", roast: "Perghh Kelah Merah! Mahsyur gila hasil kau harini bro!" },
            { name: "Kasut Getah Selut Putus", weight: "0.5 KG", price: 0, tier: "Sampah", desc: "Tersangkut kasut getah tokey kebun.", roast: "Hahaha joran bergegar ingat toman, rupanya kasut getah buruk!" }
        ];

        const caught = senaraiIkan[Math.floor(Math.random() * senaraiIkan.length)];
        cooldownMancing.set(senderId, now);

        if (caught.tier === "Sampah") {
            const responSampah = `
┌───「 🎣 𝗝𝗘𝗧𝗜 𝗣𝗔𝗡𝗖𝗜𝗡𝗚: 𝗞𝗘𝗖𝗘𝗪𝗔 」
├ 📦 𝗧𝗮𝗻𝗴𝗸𝗮𝗽𝗮𝗻 : ${caught.name}
├ ⚖️ 𝗕𝗲𝗿𝗮𝘁     : ${caught.weight}
├ 📝 𝗖𝗮𝘁𝗮𝘁𝗮𝗻   : ${caught.desc}
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "${caught.roast}"`;
            return sock.sendMessage(jid, { text: responSampah }, { quoted: m });
        }

        // Simpan ikan dalam bakul
        if (!user.inventory.fish) user.inventory.fish = [];
        user.inventory.fish.push(caught);
        user.stats.fish_caught = (user.stats.fish_caught || 0) + 1;
        await db.saveUser(user);

        const responDapat = `
┌───「 🎣 𝗝𝗘𝗧𝗜 𝗣𝗔𝗡𝗖𝗜𝗡𝗚: 𝗦𝗧𝗥𝗜𝗞𝗘! 」
├ 🐟 𝗦𝗽𝗲𝘀𝗶𝗲𝘀  : ${caught.name} [${caught.tier}]
├ ⚖️ 𝗕𝗲𝗿𝗮𝘁    : ${caught.weight}
├ 💵 𝗔𝗻𝗴𝗴𝗮𝗿𝗮𝗻: RM ${caught.price.toLocaleString()}
├ 📝 𝗖𝗮𝘁𝗮𝘁𝗮𝗻  : ${caught.desc}
└───────────────────────────
Guna \`.jual_ikan\` untuk tunaikan hasil tangkapan.
💬 𝗔𝗶𝗿𝗶: "${caught.roast}"`;

        return sock.sendMessage(jid, { text: responDapat }, { quoted: m });
    }
};
