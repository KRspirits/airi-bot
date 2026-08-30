// State lelongan global (Diubah kepada objek per-group untuk elak timer crash)
export const auctionState = {};

// Senarai Hadiah Kontena Misteri (50 Barang: Hanya Barang Fizikal Bernilai & Tunai Murni)
export const AUCTION_LOOT_POOL = [
    // --- 35 BARANG FIZIKAL & TUNAI TINGGI (UNTUNG) ---
    { name: "Peti Jongkong Emas 999 Padu (10KG) 🪙", value: 3500000, type: "untung", desc: "Emas tulen berkilau yang sangat berat!" },
    { name: "Kunci Lamborghini Huracan EVO V10 🏎️", value: 1600000, type: "untung", desc: "Supercar idaman siap geran rasmi!" },
    { name: "Cek Tunai Bersih Bank Pusat 💵", value: 1500000, type: "untung", desc: "Wang tunai fizikal dalam sampul rasmi!" },
    { name: "Cold Wallet Mengandungi 5 BTC ₿", value: 1400000, type: "untung", desc: "Dompet kripto fizikal berserta peranti perkakasan." },
    { name: "Blueprint Rahsia Jentera Shadow Legion X 🖥️", value: 1200000, type: "untung", desc: "Fail fizikal pelan prototaip peranti gaming." },
    { name: "Geran Banglo Mewah TRX Skyview 🏙️", value: 3500000, type: "untung", desc: "Dokumen hak milik hartanah fizikal." },
    { name: "Sijil Saham Korporat Shadow Legacy 📜", value: 2500000, type: "untung", desc: "Sijil fizikal pegangan saham syarikat." },
    { name: "Beg Tangan Birkin Original 👜", value: 350000, type: "untung", desc: "Beg tangan fizikal jenama mewah antarabangsa." },
    { name: "Cincin Berlian 10 Karat 💍", value: 250000, type: "untung", desc: "Barang kemas fizikal bertatahkan berlian asli." },
    { name: "Superbike Ducati Panigale V4 🏍️", value: 180000, type: "untung", desc: "Motosikal berkuasa tinggi dalam kontena." },
    { name: "Jongkong Perak 50KG 🥈", value: 100000, type: "untung", desc: "Bongkah perak fizikal tulen." },
    { name: "Set Meja Biliard Emas 🎱", value: 75000, type: "untung", desc: "Meja snuker fizikal disalut kemasan emas." },
    { name: "Lukisan Seni Klasik Terkenal 🖼️", value: 50000, type: "untung", desc: "Karya seni fizikal berserta bingkai antik." },
    { name: "Jam Tangan Rolex Daytona ⌚", value: 45000, type: "untung", desc: "Jam tangan fizikal mewah berantai emas." },
    { name: "Setup PC Gaming RTX 4090 🖥️", type: "untung", value: 45000, desc: "Rig komputer fizikal lengkap dengan perkakasan." },
    { name: "Koleksi Kasut Sneaker Rare 👟", value: 40000, type: "untung", desc: "Kotak fizikal berisi kasut edisi terhad." },
    { name: "Tiket Penerbangan First Class (Fizikal) 🎫", value: 25000, type: "untung", desc: "Tiket fizikal fizikal eksklusif." },
    { name: "Minyak Wangi Jenama Mewah 🧴", value: 20000, type: "untung", desc: "Botol fizikal pati wangian import." },
    { name: "Kotak Cerut Cuba Premium 🚬", value: 15000, type: "untung", desc: "Kotak fizikal berisi cerut tembakau asli." },
    { name: "Mesin Kira Duit Automatik 📠", value: 5000, type: "untung", desc: "Peranti perkakasan mesin fizikal." },
    { name: "Jubah Besi Kesatria Purba 🛡️", value: 80000, type: "untung", desc: "Pakaian perlindungan fizikal antik." },
    { name: "Peti Harta Karun Besi 🏴‍☠️", value: 500000, type: "untung", desc: "Peti fizikal berisi syiling logam lama." },
    { name: "Bot Laju Peribadi (Yacht) 🛥️", value: 3000000, type: "untung", desc: "Kenderaan air fizikal bersaiz besar." },
    { name: "Helikopter Peribadi 🚁", value: 4500000, type: "untung", desc: "Kenderaan udara fizikal." },
    { name: "Server Kuantum Fizikal 💾", value: 800000, type: "untung", desc: "Kabinet pelayan komputer fizikal." },
    { name: "Lesen Perniagaan Emas (Fizikal) 🪪", value: 600000, type: "untung", desc: "Kad lesen fizikal rasmi." },
    { name: "Bekas Artifak Purba 🏺", value: 450000, type: "untung", desc: "Pasu tembikar fizikal bersejarah." },
    { name: "Drone Pengintip Profesional 🛸", value: 120000, type: "untung", desc: "Gajet dron fizikal berkamera tinggi." },
    { name: "Telefon Pintar Flagship 📱", value: 6500, type: "untung", desc: "Peranti telefon pintar fizikal dalam kotak." },
    { name: "Pembesar Suara Pintar 🔊", value: 3500, type: "untung", desc: "Perangkat pembesar suara fizikal." },
    { name: "Tetikus Gaming E-Sukan 🖱️", value: 1200, type: "untung", desc: "Perkakasan tetikus fizikal berkomputer." },
    { name: "Wang Tunai Fizikal (RM50,000) 💵", value: 50000, type: "untung", desc: "Ikatan nota wang fizikal kertas." },
    { name: "Wang Tunai Fizikal (RM100,000) 💵", value: 100000, type: "untung", desc: "Koleksi wang kertas fizikal dalam beg." },
    { name: "Wang Tunai Fizikal (RM250,000) 💵", value: 250000, type: "untung", desc: "Pendapatan tunai fizikal bertompok." },
    { name: "Wang Tunai Fizikal (RM500,000) 💵", value: 500000, type: "untung", desc: "Peti keselamatan padat berisi wang fizikal." },

    // --- 15 BARANG SCAM / SAMPAH FIZIKAL (RUGI TERUK) ---
    { name: "Sekotak Habuk Kayu & Pasir Sungai 💨", value: 10, type: "rugi", desc: "Kotak fizikal yang hanya dipenuhi habuk." },
    { name: "Bata Merah Rumah Pembinaan 🧱", value: 50, type: "rugi", desc: "Seketul bata fizikal berat tanpa nilai." },
    { name: "Rim Basikal Karat Terpakai 🛞", value: 20, type: "rugi", desc: "Sisa besi fizikal yang sudah berkarat." },
    { name: "Selipar Jepun Sebelah Kiri 🩴", value: 2, type: "rugi", desc: "Sebelah kasut getah fizikal terpakai." },
    { name: "Kunci Mangga Rosak Tanpa Anak 🔒", value: 5, type: "rugi", desc: "Peralatan besi fizikal yang sudah patah." },
    { name: "Mouse Pad Koyak Rabak 🖱️", value: 3, type: "rugi", desc: "Kain alas fizikal yang sudah rosak." },
    { name: "Bateri Kereta Sudah Kong 🔋", value: 20, type: "rugi", desc: "Kotak bateri fizikal berat yang kering asid." },
    { name: "Botol Kicap Kaca Kosong 🍾", value: 2, type: "rugi", desc: "Botol fizikal terpakai buangan." },
    { name: "Kabel USB Putus Dalam 🔌", value: 4, type: "rugi", desc: "Wayar fizikal bersalut plastik rosak." },
    { name: "Kertas Pembalut Gula-gula 🍬", value: 1, type: "rugi", desc: "Sisa plastik fizikal ringan." },
    { name: "Skrin Telefon Pecah Seribu 📱", value: 50, type: "rugi", desc: "Serpihan kaca fizikal peranti rosak." },
    { name: "Surat Saman Mahkamah Orang Lain 📄", value: 0, type: "rugi", desc: "Kertas fizikal dokumen terbuang." },
    { name: "Bangkai Ikan Buntal Kering 🐡", value: 0, type: "rugi", desc: "Sisa fizikal biologi berbau busuk." },
    { name: "Beras Hancur Berulat 1KG 🍚", value: 3, type: "rugi", desc: "Bahan makanan fizikal rosak bertarikh." },
    { name: "Akaun Fizikal Kad Sim Toksik 📱", value: 5, type: "rugi", desc: "Kepingan kad plastik fizikal terpakai." }
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
⚠️ *Peringatan:* Isi kontena boleh jadi *BARANG FIZIKAL BERHARGA*, *TUNAI TINGGI*, atau *SAMPAH KOSONG*!
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
            ? "PERGHHH KAYA RAYA! Rezeki terpijak dapat barang fizikal bernilai tinggi atau tunai kontang!"
            : "HAHAHAHA KENA SCAM! Bida ratus ribu last-last dalam kontena cuma ada sampah fizikal!";

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
