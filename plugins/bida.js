// State lelongan global (Diubah kepada objek per-group untuk elak timer crash)
export const auctionState = {};

// Senarai Hadiah Kontena Misteri (50 Barang: 35 Untung vs 15 Scam)
export const AUCTION_LOOT_POOL = [
    // --- 35 BARANG BERNILAI TINGGI (UNTUNG) ---
    { name: "Sijil Saham Shadow Legacy Co., Ltd. 📜", value: 5000000, type: "untung", desc: "Pegangan saham syarikat gergasi bernilai jutaan ringgit!" },
    { name: "Kunci Lamborghini Huracan EVO V10 🏎️", value: 1600000, type: "untung", desc: "Supercar idaman siap geran rasmi!" },
    { name: "Peti Jongkong Emas 999 Padu (10KG) 🪙", value: 3500000, type: "untung", desc: "Emas tulen berkilau yang sangat berat!" },
    { name: "Blueprint Rahsia Jentera Shadow Legion X 🖥️", value: 1200000, type: "untung", desc: "Pelan prototaip peranti gaming masa hadapan." },
    { name: "Geran Banglo Mewah TRX Skyview 🏙️", value: 3500000, type: "untung", desc: "Hartanah mewah tengah bandaraya!" },
    { name: "Cold Wallet Mengandungi 5 BTC ₿", value: 1400000, type: "untung", desc: "Dompet kripto peninggalan taikun siber!" },
    { name: "Jam Tangan Pintar Shadow Eclipse ⌚", value: 45000, type: "untung", desc: "Edisi terhad dengan kemasan premium!" },
    { name: "Telefon Pintar iQOO 12 (OriginOS) 📱", value: 6500, type: "untung", desc: "Gajet gaming paling berkuasa di pasaran." },
    { name: "Cek Tunai Bersih Bank Pusat 💵", value: 800000, type: "untung", desc: "Duit tunai bersih dijamin bank!" },
    { name: "Akaun Steam VVIP (DLC Fishing Planet) 🕹️", value: 15000, type: "untung", desc: "Akaun dewa penuh dengan game mahal." },
    { name: "Pembesar Suara Pintar Xiao V 🔊", value: 3500, type: "untung", desc: "Pembantu maya paling cerdik untuk rumah pintar." },
    { name: "Mouse Gaming 4-Stage DPI (Custom) 🖱️", value: 1200, type: "untung", desc: "Tetapan sensitiviti khas untuk e-sukan." },
    { name: "Helikopter Peribadi Apache 🚁", value: 4500000, type: "untung", desc: "Boleh terbang pusing bandar elak jem." },
    { name: "Kotak Misteri MLBB (Skin Legend) 🔮", value: 5000, type: "untung", desc: "Akaun sultan penuh skin rare." },
    { name: "Kad Kredit Black Card (Limit 1M) 💳", value: 1000000, type: "untung", desc: "Kad tanpa limit untuk borong satu kedai." },
    { name: "Beg Tangan Birkin Original 👜", value: 350000, type: "untung", desc: "Beg tangan idaman para isteri." },
    { name: "Setup PC Gaming RTX 4090 🖥️", value: 45000, type: "untung", desc: "PC raksasa boleh main semua game setting Ultra." },
    { name: "Kucing Oyen Baka Kayangan 🐈", value: 12000, type: "untung", desc: "Oyen kacukan yang sangat manja dan mahal." },
    { name: "Cincin Berlian 10 Karat 💍", value: 250000, type: "untung", desc: "Berlian tulen yang menyilaukan mata." },
    { name: "Superbike Ducati Panigale V4 🏍️", value: 180000, type: "untung", desc: "Motor kuasa besar paling laju di litar." },
    { name: "Lukisan Mona Lisa (Replika Gred A) 🖼️", value: 50000, type: "untung", desc: "Nampak macam ori, boleh jual harga tinggi!" },
    { name: "Tiket Penerbangan First Class 🎫", value: 25000, type: "untung", desc: "Boleh melancong ke Eropah layan kelas pertama." },
    { name: "Bot Laju Mewah (Yacht) 🛥️", value: 3000000, type: "untung", desc: "Sesuai untuk kaki pancing VIP laut dalam." },
    { name: "Jongkong Perak 50KG 🥈", value: 100000, type: "untung", desc: "Bongkah perak tulen yang sangat padat." },
    { name: "Server Kuantum Peribadi 💾", value: 800000, type: "untung", desc: "Boleh host bot beribu grup tanpa lag." },
    { name: "Koleksi Kasut Sneaker Rare 👟", value: 40000, type: "untung", desc: "Kasut edisi terhad tak pernah jejak tanah." },
    { name: "Lesen Pasaran Gelap VVIP 🪪", value: 600000, type: "untung", desc: "Kebal dari serbuan polis masa buat jenayah." },
    { name: "Set Meja Biliard Emas 🎱", value: 75000, type: "untung", desc: "Meja pool disalut emas 24k." },
    { name: "Drone Pengintip Tentera 🛸", value: 120000, type: "untung", desc: "Dilengkapi kamera haba dan kalis peluru." },
    { name: "Kotak Cerut Cuba Premium 🚬", value: 15000, type: "untung", desc: "Barang import khas untuk bos-bos besar." },
    { name: "Bekas Abu Tinggalan Firaun 🏺", value: 450000, type: "untung", desc: "Artifak purba yang diseludup dari muzium." },
    { name: "Minyak Wangi Kasturi Asli 🧴", value: 20000, type: "untung", desc: "Pati minyak wangi paling mahal di dunia." },
    { name: "Mesin Kira Duit Automatik 📠", value: 5000, type: "untung", desc: "Mesin gred bank untuk kira duit haram." },
    { name: "Jubah Besi Kesatria Purba 🛡️", value: 80000, type: "untung", desc: "Pakaian perang zaman pertengahan." },
    { name: "Peti Harta Karun Lanun 🏴‍☠️", value: 500000, type: "untung", desc: "Berisi syiling emas peninggalan zaman lampau." },

    // --- 15 BARANG SCAM / HABUK (RUGI TERUK) ---
    { name: "Akaun TikTok Shop (Kena Banned) 📱", value: 5, type: "rugi", desc: "Akaun dah kena block, tak boleh buat meniaga!" },
    { name: "Skrin iQOO 12 Pecah Seribu 📱", value: 50, type: "rugi", desc: "Hanya tinggal serpihan kaca tajam." },
    { name: "Sekotak Habuk Kayu & Pasir Sungai 💨", value: 10, type: "rugi", desc: "Kena scam! Dalam peti cuma ada habuk." },
    { name: "Bata Merah Rumah Tinggalan Bersimen 🧱", value: 50, type: "rugi", desc: "Berat macam emas, rupanya seketul bata buruk!" },
    { name: "Bangkai Ikan Buntal Masin Bau Hanyir 🐡", value: 0, type: "rugi", desc: "Kontena bocor tinggal sisa bangkai berulat!" },
    { name: "Surat Saman Tertunggak Mahkamah 📄", value: 0, type: "rugi", desc: "Bukan harta, tapi hutang orang lain!" },
    { name: "Rim Basikal Karat Tanpa Tayar 🛞", value: 20, type: "rugi", desc: "Hanya sekeping besi buruk tiada nilai!" },
    { name: "Kertas Pembalut Gula-gula 🍬", value: 1, type: "rugi", desc: "Sampah sarap yang tertinggal dalam kontena." },
    { name: "Selipar Jepun Sebelah Kiri 🩴", value: 2, type: "rugi", desc: "Mana pergi sebelah kanan?! Menyesal bida." },
    { name: "Kunci Mangga Berkarat Tanpa Kunci 🔒", value: 5, type: "rugi", desc: "Mangga dah berkarat teruk dan tak boleh buka." },
    { name: "Mouse Pad Koyak Rabak 🖱️", value: 3, type: "rugi", desc: "Kesan gigitan tikus berserta bau hapak." },
    { name: "Bateri Kereta Kong 🔋", value: 20, type: "rugi", desc: "Asid dah kering, boleh jual kat besi buruk je." },
    { name: "Botol Kicap Kosong 🍾", value: 2, type: "rugi", desc: "Langsung tak ada nilai, buat kumpul habuk." },
    { name: "Beras Hancur Berulat 1KG 🍚", value: 3, type: "rugi", desc: "Dah berbau kepam, ayam pun tak nak makan." },
    { name: "Kabel USB Putus Dalam 🔌", value: 4, type: "rugi", desc: "Nampak elok kat luar tapi cas fon tak masuk!" }
];

// Fungsi Memulakan Lelongan (Dipanggil oleh Loop Random Event)
export async function triggerRandomAuction(sock, chatId) {
    if (auctionState[chatId] && auctionState[chatId].active) return;

    // Harga tapak permulaan rawak
    const basePrices = [20000, 50000, 100000, 250000];
    const tapak = basePrices[Math.floor(Math.random() * basePrices.length)];

    auctionState[chatId] = {
        active: true,
        startPrice: tapak,
        currentBid: tapak,
        highestBidder: null,
        highestBidderName: 'Tiada',
        endsAt: Date.now() + 60000 // 60 saat durasi
    };

    const notis = `
┌───「 📦 𝗟𝗘𝗟𝗢𝗡𝗚𝗔𝗡 𝗞𝗢𝗡𝗧𝗘𝗡𝗔 𝗠𝗜𝗦𝗧𝗘𝗥𝗜! 」
│ _Kontena tersadai dari Pelabuhan Klang dibuka untuk bidaan!_
├───────────────────────────
├ 💵 𝗛𝗮𝗿𝗴𝗮 𝗧𝗮𝗽𝗮𝗸   : RM ${tapak.toLocaleString()}
├ 📈 𝗕𝗶𝗱𝗮𝗮𝗻 𝗦𝗲𝗺𝗮𝘀𝗮 : RM ${tapak.toLocaleString()}
├ 👤 𝗣𝗲𝗺𝗯𝗶𝗱𝗮 𝗧𝗲𝗿𝗮𝘁𝗮𝘀: Tiada
├ ⏳ 𝗧𝗲𝗺𝗽𝗼𝗵 𝗠𝗮𝘀𝗮   : 60 Saat Sahaja!
└───────────────────────────
⚠️ *Peringatan:* Isi kontena boleh jadi *HARTA JUTAAN RINGGIT* atau *HABUK KOSONG*!
👉 Taip: \`.bida [jumlah_rm]\` untuk membida!`;

    await sock.sendMessage(chatId, { text: notis });

    // Tamat Lelongan Selepas 60 Saat
    setTimeout(async () => {
        const lelong = auctionState[chatId];
        if (!lelong || !lelong.active) return;
        lelong.active = false;

        if (!lelong.highestBidder) {
            delete auctionState[chatId];
            return sock.sendMessage(chatId, { text: '🔔 *LELONGAN TAMAT!* Tiada sesiapa yang meletakkan tawaran harga.' });
        }

        const { db } = await import('../lib/database.js');
        const pemenang = await db.getUser(lelong.highestBidder);
        const hasilLoot = AUCTION_LOOT_POOL[Math.floor(Math.random() * AUCTION_LOOT_POOL.length)];

        pemenang.wallet += hasilLoot.value;
        await db.saveUser(pemenang);

        const roaster = hasilLoot.type === "untung"
            ? "PERGHHH KAYA RAYA! Rezeki terpijak dapat jackpot juta-juta!"
            : "HAHAHAHA KENA SCAM! Bida ratus ribu last-last dapat habuk dengan bata!";

        const teksMenang = `
┌───「 🏆 𝗞𝗘𝗣𝗨𝗧𝗨𝗦𝗔𝗡 𝗟𝗘𝗟𝗢𝗡𝗚𝗔𝗡 𝗞𝗢𝗡𝗧𝗘𝗡𝗔 」
├ 👤 𝗣𝗲𝗺𝗲𝗻𝗮𝗻𝗴 : @${lelong.highestBidder.split('@')[0]}
├ 💸 𝗛𝗮𝗿𝗴𝗮 𝗕𝗶𝗱𝗮 : RM ${lelong.currentBid.toLocaleString()}
├───────────────────────────
├ 📦 𝗜𝘀𝗶 𝗞𝗼𝗻𝘁𝗲𝗻𝗮: *${hasilLoot.name}*
├ 💵 𝗡𝗶𝗹𝗮𝗶 𝗦𝗲𝗯𝗲𝗻𝗮𝗿: RM ${hasilLoot.value.toLocaleString()}
├ 📝 𝗞𝗲𝘁𝗲𝗿𝗮𝗻𝗴𝗮𝗻 : ${hasilLoot.desc}
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "${roaster}"`;

        await sock.sendMessage(chatId, { text: teksMenang, mentions: [lelong.highestBidder] });
        delete auctionState[chatId];
    }, 60000);
}

export default {
    name: 'bida',
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const senderJid = m.key.participant || jid;
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const args = teks.trim().split(' ').slice(1);
        
        const lelong = auctionState[jid];

        if (!lelong || !lelong.active) {
            return sock.sendMessage(jid, { text: '❌ Tiada lelongan kontena misteri yang sedang aktif sekarang!' }, { quoted: m });
        }

        const amaunBida = parseInt(args[0]);
        if (isNaN(amaunBida)) {
            return sock.sendMessage(jid, {
                text: `❌ Masukkan angka bidaan!\nBidaan semasa: *RM ${lelong.currentBid.toLocaleString()}*\nContoh: \`.bida ${lelong.currentBid + 10000}\``
            }, { quoted: m });
        }

        if (amaunBida <= lelong.currentBid) {
            return sock.sendMessage(jid, {
                text: `❌ Bidaan mesti LEBIH TINGGI daripada bidaan semasa (RM ${lelong.currentBid.toLocaleString()})!`
            }, { quoted: m });
        }

        if (user.wallet < amaunBida) {
            return sock.sendMessage(jid, {
                text: `❌ Duit poket kau tak cukup! Kau cuma ada RM ${user.wallet.toLocaleString()}`
            }, { quoted: m });
        }

        // Refund duit pembida sebelumnya jika ada
        if (lelong.highestBidder && lelong.highestBidder !== senderJid) {
            const prevUser = await db.getUser(lelong.highestBidder);
            prevUser.wallet += lelong.currentBid;
            await db.saveUser(prevUser);
        }

        // Tolak duit pembida baharu
        user.wallet -= amaunBida;
        await db.saveUser(user);

        lelong.currentBid = amaunBida;
        lelong.highestBidder = senderJid;
        lelong.highestBidderName = m.pushName || 'Warga Gelap';

        return sock.sendMessage(jid, {
            text: `📈 *BIDAAN BAHARU DITERIMA!*\n👤 @${senderJid.split('@')[0]} meletakkan tawaran: *RM ${amaunBida.toLocaleString()}*!\nAda siapa lagi nak lawan? Taip \`.bida [nilai]\`!`,
            mentions: [senderJid]
        });
    }
};
