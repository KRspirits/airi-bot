// State lelongan global dalam memori
export let auctionState = {
    active: false,
    startPrice: 0,
    currentBid: 0,
    highestBidder: null,
    highestBidderName: '',
    endsAt: 0,
    chatId: null
};

// Senarai Hadiah Kontena Misteri (Untung Gila vs Rugi Bersih)
export const AUCTION_LOOT_POOL = [
    // JACKPOT / UNTUNG TINGGI
    { name: "Kunci Lamborghini Huracan EVO V10 🏎️", value: 1600000, type: "untung", desc: "Supercar idaman siap geran rasmi!" },
    { name: "Peti Jongkong Emas 999 Padu (10KG) 🪙", value: 3500000, type: "untung", desc: "Emas tulen berkilau bernilai jutaan ringgit!" },
    { name: "Cold Wallet Mengandungi 5 BTC ₿", value: 1400000, type: "untung", desc: "Dompet kripto peninggalan taikun siber!" },
    { name: "Geran Banglo Mewah TRX Skyview 🏙️", value: 3500000, type: "untung", desc: "Hartanah mewah tengah bandaraya!" },
    { name: "Cek Tunai Bersih Bank Pusat 💵", value: 800000, type: "untung", desc: "Duit tunai bersih dijamin bank!" },

    // SCAM / RUGI TERUK
    { name: "Sekotak Habuk Kayu & Pasir Sungai 💨", value: 10, type: "rugi", desc: "Kena scam hidup-hidup! Dalam peti cuma ada habuk kayu." },
    { name: "Bata Merah Rumah Tinggalan Bersimen 🧱", value: 50, type: "rugi", desc: "Berat macam emas, bila buka cuma seketul bata buruk!" },
    { name: "Bangkai Ikan Buntal Masin Bau Hanyir 🐡", value: 0, type: "rugi", desc: "Kontena bocor tinggal sisa bangkai berulat!" },
    { name: "Surat Saman Tertunggak Mahkamah 📄", value: 0, type: "rugi", desc: "Bukan harta, tapi kertas saman orang lain!" },
    { name: "Rim Basikal Karat Tanpa Tayar 🛞", value: 20, type: "rugi", desc: "Hanya sekeping besi buruk tiada nilai!" }
];

// Fungsi Memulakan Lelongan (Dipanggil oleh Loop Random Event)
export async function triggerRandomAuction(sock, chatId) {
    if (auctionState.active) return;

    // Harga tapak permulaan rawak
    const basePrices = [20000, 50000, 100000, 250000];
    const tapak = basePrices[Math.floor(Math.random() * basePrices.length)];

    auctionState = {
        active: true,
        startPrice: tapak,
        currentBid: tapak,
        highestBidder: null,
        highestBidderName: 'Tiada',
        endsAt: Date.now() + 60000, // 60 saat durasi
        chatId: chatId
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
        if (!auctionState.active) return;
        auctionState.active = false;

        if (!auctionState.highestBidder) {
            return sock.sendMessage(chatId, { text: '🔔 *LELONGAN TAMAT!* Tiada sesiapa yang meletakkan tawaran harga.' });
        }

        const { db } = await import('../lib/database.js');
        const pemenang = await db.getUser(auctionState.highestBidder);
        const hasilLoot = AUCTION_LOOT_POOL[Math.floor(Math.random() * AUCTION_LOOT_POOL.length)];

        pemenang.wallet += hasilLoot.value;
        await db.saveUser(pemenang);

        const roaster = hasilLoot.type === "untung"
            ? "PERGHHH KAYA RAYA! Rezeki terpijak dapat jackpot juta-juta!"
            : "HAHAHAHA KENA SCAM! Bida ratus ribu last-last dapat habuk dengan bata!";

        const teksMenang = `
┌───「 🏆 𝗞𝗘𝗣𝗨𝗧𝗨𝗦𝗔𝗡 𝗟𝗘𝗟𝗢𝗡𝗚𝗔𝗡 𝗞𝗢𝗡𝗧𝗘𝗡𝗔 」
├ 👤 𝗣𝗲𝗺𝗲𝗻𝗮𝗻𝗴 : @${auctionState.highestBidder.split('@')[0]}
├ 💸 𝗛𝗮𝗿𝗴𝗮 𝗕𝗶𝗱𝗮 : RM ${auctionState.currentBid.toLocaleString()}
├───────────────────────────
├ 📦 𝗜𝘀𝗶 𝗞𝗼𝗻𝘁𝗲𝗻𝗮: *${hasilLoot.name}*
├ 💵 𝗡𝗶𝗹𝗮𝗶 𝗦𝗲𝗯𝗲𝗻𝗮𝗿: RM ${hasilLoot.value.toLocaleString()}
├ 📝 𝗞𝗲𝘁𝗲𝗿𝗮𝗻𝗴𝗮𝗻 : ${hasilLoot.desc}
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "${roaster}"`;

        await sock.sendMessage(chatId, {
            text: teksMenang,
            mentions: [auctionState.highestBidder]
        });
    }, 60000);
}

export default {
    name: 'bida',
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const senderJid = m.key.participant || jid;
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const args = teks.trim().split(' ').slice(1);

        if (!auctionState.active) {
            return sock.sendMessage(jid, { text: '❌ Tiada lelongan kontena misteri yang sedang aktif sekarang!' }, { quoted: m });
        }

        const amaunBida = parseInt(args[0]);
        if (isNaN(amaunBida)) {
            return sock.sendMessage(jid, {
                text: `❌ Masukkan angka bidaan!\nBidaan semasa: *RM ${auctionState.currentBid.toLocaleString()}*\nContoh: \`.bida ${auctionState.currentBid + 10000}\``
            }, { quoted: m });
        }

        if (amaunBida <= auctionState.currentBid) {
            return sock.sendMessage(jid, {
                text: `❌ Bidaan mesti LEBIH TINGGI daripada bidaan semasa (RM ${auctionState.currentBid.toLocaleString()})!`
            }, { quoted: m });
        }

        if (user.wallet < amaunBida) {
            return sock.sendMessage(jid, {
                text: `❌ Duit poket kau tak cukup! Kau cuma ada RM ${user.wallet.toLocaleString()}`
            }, { quoted: m });
        }

        // Refund duit pembida sebelumnya jika ada
        if (auctionState.highestBidder && auctionState.highestBidder !== senderJid) {
            const prevUser = await db.getUser(auctionState.highestBidder);
            prevUser.wallet += auctionState.currentBid;
            await db.saveUser(prevUser);
        }

        // Tolak duit pembida baharu
        user.wallet -= amaunBida;
        await db.saveUser(user);

        auctionState.currentBid = amaunBida;
        auctionState.highestBidder = senderJid;
        auctionState.highestBidderName = m.pushName || 'Warga Gelap';

        return sock.sendMessage(jid, {
            text: `📈 *BIDAAN BAHARU DITERIMA!*\n👤 @${senderJid.split('@')[0]} meletakkan tawaran: *RM ${amaunBida.toLocaleString()}*!\nAda siapa lagi nak lawan? Taip \`.bida [nilai]\`!`,
            mentions: [senderJid]
        });
    }
};
