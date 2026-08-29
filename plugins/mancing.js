import { FISH_DATABASE } from '../lib/gamedata.js';

// Pengendali Cooldown Memancing (35 Saat per Pemain)
const cdMancing = new Map();

export default {
    name: 'mancing',
    alias: ['jual_ikan', 'akuarium', 'bela_ikan'],
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const senderId = m.key.participant || jid;
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const cmd = teks.slice(1).trim().split(' ')[0].toLowerCase();
        const now = Date.now();

        // -------------------------------------------------------------
        // A. JUAL SEMUA IKAN (.jual_ikan)
        // -------------------------------------------------------------
        if (cmd === 'jual_ikan') {
            if (!user.inventory?.fish || user.inventory.fish.length === 0) {
                return sock.sendMessage(jid, { 
                    text: '🐟 Raga ikan awak kosong! Baling joran dulu guna perintah `.mancing` ya~ 🌸' 
                }, { quoted: m });
            }

            let totalDapat = 0;
            let adaMythic = false;
            let senaraiIkanMythic = [];

            user.inventory.fish.forEach(ikan => {
                totalDapat += ikan.price;
                if (ikan.tier === 'Mythic') {
                    adaMythic = true;
                    senaraiIkanMythic.push(ikan.name);
                }
            });

            const jumlahEkor = user.inventory.fish.length;
            user.wallet += totalDapat;
            user.inventory.fish = []; // Kosongkan raga simpanan
            await db.saveUser(user);

            let respon = `
┌───「 💰 𝗣𝗘𝗠𝗕𝗢𝗥𝗢𝗡𝗚 𝗝𝗘𝗧𝗜: 𝗝𝗨𝗔𝗟𝗔𝗡 𝗦𝗘𝗟𝗘𝗦𝗔𝗜 」
├ 📦 𝗝𝘂𝗺𝗹𝗮𝗵 𝗜𝗸𝗮𝗻 : ${jumlahEkor} Ekor
├ 💵 𝗧𝘂𝗻𝗮𝗶 𝗠𝗮𝘀𝘂𝗸 : +RM ${totalDapat.toLocaleString()}
└───────────────────────────`;

            if (adaMythic) {
                respon += `\n🚨 *BERITA GEMPAR JETI!*\nPemborong membeli tangkapan bernilai jutaan ringgit: *${senaraiIkanMythic.join(', ')}*!\n💬 𝗔𝗶𝗿𝗶: "KAYAAA RAYAAA KAWAN KITA NI WEHH! Jangan lupa belanja Airi boba seumur hidup pleaseee~ 🥺✨"`;
            } else {
                respon += `\n💬 𝗔𝗶𝗿𝗶: "Alhamdulillah rezeki memancing hari ni! Duit dah selamat masuk poket awak tau~ 🤍"`;
            }

            return sock.sendMessage(jid, { text: respon }, { quoted: m });
        }

        // -------------------------------------------------------------
        // B. SEMAK STATUS AKUARIUM (.akuarium)
        // -------------------------------------------------------------
        if (cmd === 'akuarium') {
            const listIkan = user.inventory?.fish || [];
            if (listIkan.length === 0) {
                return sock.sendMessage(jid, { 
                    text: '🏛️ Raga dan akuarium awak masih kosong! Pergi memancing guna `.mancing` dulu.' 
                }, { quoted: m });
            }

            let uiAkuarium = `┌───「 🏛️ 𝗔𝗞𝗨𝗔𝗥𝗜𝗨𝗠 & 𝗥𝗔𝗚𝗔 𝗜𝗞𝗔𝗡 𝗔𝗪𝗔𝗞 」\n├───────────────────────────\n`;
            listIkan.forEach((ikan, index) => {
                uiAkuarium += `├ [${index + 1}] *${ikan.name}* [${ikan.tier}]\n│   ⚖️ Berat: ${ikan.weight} KG ︲ 💵 RM ${ikan.price.toLocaleString()}\n`;
            });
            uiAkuarium += `└───────────────────────────\nTaip \`.jual_ikan\` untuk jual semua hasil tangkapan di pasar! 🐟`;

            return sock.sendMessage(jid, { text: uiAkuarium }, { quoted: m });
        }

        // -------------------------------------------------------------
        // C. OPERASI MEMANCING (.mancing)
        // -------------------------------------------------------------
        // Semakan jika pemain berada dalam lokap balai
        if (user.jail?.status && now < user.jail.release_at) {
            const bakiLokap = Math.ceil((user.jail.release_at - now) / 1000);
            return sock.sendMessage(jid, { 
                text: `⛓️ Awak tengah merengkok dalam lokap (${bakiLokap}s lagi)! Kat mana awak nak dapatkan air untuk memancing? 🔒` 
            }, { quoted: m });
        }

        // Semakan Cooldown 35 Saat
        const cdTime = 35 * 1000;
        const lastRun = cdMancing.get(senderId) || 0;
        if (now - lastRun < cdTime) {
            const bakiSaat = Math.ceil((cdTime - (now - lastRun)) / 1000);
            return sock.sendMessage(jid, { 
                text: `⏳ Sabar wehh, umpan tengah hanyut dibawa arus! Tunggu lagi *${bakiSaat} saat* sebelum baling kail semula ya~ 🥺` 
            }, { quoted: m });
        }
        cdMancing.set(senderId, now);

        // Algoritma Penentuan Gred Tangkapan (RNG Tiers)
        const rng = Math.random();
        let targetTier = 'Common';

        if (rng < 0.01) {
            targetTier = 'Mythic';       // 1% Peluang (Jackpot Jutaan Ringgit)
        } else if (rng < 0.05) {
            targetTier = 'Legendary';    // 4% Peluang
        } else if (rng < 0.15) {
            targetTier = 'Epic';         // 10% Peluang
        } else if (rng < 0.30) {
            targetTier = 'Rare';         // 15% Peluang
        } else if (rng < 0.55) {
            targetTier = 'Uncommon';     // 25% Peluang
        } else {
            targetTier = 'Common';       // 45% Peluang
        }

        // Pilih ikan rawak daripada kategori yang terpilih
        const pool = FISH_DATABASE.filter(f => f.tier === targetTier);
        const ikanDapat = pool[Math.floor(Math.random() * pool.length)];

        // Kira harga rawak dalam julat harga spesies
        const hargaIkan = Math.floor(Math.random() * (ikanDapat.maxPrice - ikanDapat.minPrice + 1)) + ikanDapat.minPrice;
        
        // Berat ikan berdasarkan tier
        const multiplierBerat = targetTier === 'Mythic' ? 85 : (targetTier === 'Legendary' ? 45 : 12);
        const beratIkan = (Math.random() * multiplierBerat + 1.2).toFixed(2);

        // Simpan ke inventori pemain
        if (!user.inventory) user.inventory = {};
        if (!user.inventory.fish) user.inventory.fish = [];

        user.inventory.fish.push({
            id: ikanDapat.id,
            name: ikanDapat.name,
            tier: ikanDapat.tier,
            weight: beratIkan,
            price: hargaIkan
        });

        if (!user.stats) user.stats = {};
        user.stats.fish_caught = (user.stats.fish_caught || 0) + 1;
        await db.saveUser(user);

        // Pengumuman Khas Berita Gempar jika dapat Tier Mythic
        if (targetTier === 'Mythic') {
            const announce = `
╔═════════════════════════════╗
   🌌 𝗧𝗔𝗡𝗚𝗞𝗔𝗣𝗔𝗡 𝗠𝗜𝗧𝗢𝗦 𝗗𝗨𝗡𝗜𝗔! 🌌
╠═════════════════════════════╣
║ 👤 𝗣𝗲𝗺𝗮𝗻𝗰𝗶𝗻𝗴 : @${senderId.split('@')[0]}
║ 🐟 𝗦𝗽𝗲𝘀𝗶𝗲𝘀   : ${ikanDapat.name}
║ ⚖️ 𝗕𝗲𝗿𝗮𝘁     : ${beratIkan} KG
║ 💎 𝗡𝗶𝗹𝗮𝗶     : RM ${hargaIkan.toLocaleString()}
╚═════════════════════════════╝
Jeti gempar! Makhluk mitos yang bernilai jutaan ringgit berjaya dinaikkan ke darat!
👉 Taip \`.jual_ikan\` sekarang untuk serahkan kepada pemborong dan terima tunai jutaan ringgit!

💬 𝗔𝗶𝗿𝗶: "OMGGGGGGG BETUL KE NI?! Tangan awak ada magis ke wehhh dapat ikan bernilai jutaan ringgit?! 😱✨"`;

            return sock.sendMessage(jid, { text: announce, mentions: [senderId] });
        }

        // Maklum balas tangkapan biasa
        return sock.sendMessage(jid, {
            text: `
🎣 *JORAN BERGETAR PADU!*
Tangkapan : *${ikanDapat.name}* [${ikanDapat.tier}]
Berat     : ${beratIkan} KG
Nilai     : RM ${hargaIkan.toLocaleString()}
Raga Ikan : ${user.inventory.fish.length} Ekor

Taip \`.jual_ikan\` untuk jual semua hasil tangkapan di jeti! 🐟`
        }, { quoted: m });
    }
};
