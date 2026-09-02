// Memori global untuk event Trak Wang Kilat & Lelongan Bida
const kutipState = {};
const bidaState = {};

// SENARAI BARANG LELONG & JENIS GANJARAN
const SENARAI_LELONG = [
    // Jenis: Tunai (Misteri)
    { nama: "💼 Beg Duit Kartel Mexico", jenis: 'tunai', minTunai: 50000, maxTunai: 200000, minBid: 20000 },
    { nama: "🏭 Gudang Haram Terbengkalai", jenis: 'tunai', minTunai: 150000, maxTunai: 600000, minBid: 50000 },
    
    // Jenis: Kenderaan (Masuk Garaj)
    { nama: "📦 Kontena Kereta Import Jepun", jenis: 'kereta', reward: 'Nissan Skyline GTR R34', nilaiPasaran: 350000, minBid: 50000 },
    { nama: "🚗 Kereta Berhabuk VIP di KLIA", jenis: 'kereta', reward: 'Lamborghini Aventador', nilaiPasaran: 1200000, minBid: 150000 },
    { nama: "🏍️ Kotak Kayu Seludup Sempadan", jenis: 'kereta', reward: 'Kawasaki H2R', nilaiPasaran: 250000, minBid: 30000 },
    
    // Jenis: Aset (Emas / BTC)
    { nama: "🪙 Peti Besi Pejabat Tanah Lama", jenis: 'emas', reward: 500, nilaiPasaran: 150000, minBid: 25000 }, // 500 gram emas
    { nama: "🖥️ Pelayan PC Godam PDRM", jenis: 'btc', reward: 2, nilaiPasaran: 500000, minBid: 100000 } // 2 unit BTC
];

export async function triggerSpeedDrop(sock, targetGroup) {
    const kodRahsia = Math.floor(Math.random() * 900) + 100; 
    const jumlahWang = Math.floor(Math.random() * 50000) + 10000;

    kutipState[targetGroup] = { aktif: true, kod: kodRahsia, jumlah: jumlahWang };

    let msg = `┌───「 🚚 𝗧𝗥𝗔𝗞 𝗦𝗘𝗞𝗨𝗥𝗜𝗧𝗜 𝗧𝗘𝗥𝗕𝗔𝗟𝗜𝗞! 」\n` +
              `│ *Pintu belakang van keselamatan pecah di lebuh raya!*\n` +
              `├───────────────────────────\n` +
              `├ 💰 Wang Tercicir : RM ${jumlahWang.toLocaleString()}\n` +
              `├ ⚡ Tindakan Pantas: Taip kod di bawah terpantas!\n` +
              `└───────────────────────────\n\n` +
              `👉 Taip segera: \`.kutip ${kodRahsia}\``;

    await sock.sendMessage(targetGroup, { text: msg });

    setTimeout(() => {
        if (kutipState[targetGroup] && kutipState[targetGroup].aktif) {
            delete kutipState[targetGroup];
            sock.sendMessage(targetGroup, { text: `☁️ Orang ramai dah sapu habis semua duit! Tiada siapa yang sempat kutip.` }).catch(() => {});
        }
    }, 30000);
}

export default {
    name: 'kutip',
    alias: ['grab', 'ambil', 'bida', 'mula_bida', 'lelong'],
    execute: async ({ sock, m, user, db }) => {
        try {
            const jid = m.key.remoteJid;
            const senderId = m.key.participant || jid;
            const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
            const args = teks.trim().split(' ').slice(1);
            const cmd = teks.slice(1).trim().split(' ')[0].toLowerCase();

            // ============================================
            // 1. SISTEM KUTIP TRAK TERBALIK
            // ============================================
            if (cmd === 'kutip' || cmd === 'grab' || cmd === 'ambil') {
                const kodMasuk = parseInt(args[0]);
                if (!kutipState[jid] || !kutipState[jid].aktif) return sock.sendMessage(jid, { text: `❌ Tiada trak duit terbalik buat masa ni.` }, { quoted: m });
                if (isNaN(kodMasuk) || kodMasuk !== kutipState[jid].kod) return sock.sendMessage(jid, { text: `❌ Kod salah! Cepat cuba lagi sebelum orang lain rembat.` }, { quoted: m });

                const hadiah = kutipState[jid].jumlah;
                delete kutipState[jid]; 

                user.wallet = (user.wallet || 0) + hadiah;
                await db.saveUser(user);

                return sock.sendMessage(jid, { text: `⚡ *PANTAS!* @${senderId.split('@')[0]} berjaya menyambar beg duit sebanyak *RM ${hadiah.toLocaleString()}* dari tengah lebuh raya!`, mentions: [senderId] }, { quoted: m });
            }

            // ============================================
            // 2. SISTEM LELONGAN BIDA (ITEM/KERETA/ASET)
            // ============================================
            if (cmd === 'mula_bida' || cmd === 'lelong' || (cmd === 'bida' && args[0]?.toLowerCase() === 'mula')) {
                if (bidaState[jid] && bidaState[jid].aktif) return sock.sendMessage(jid, { text: `❌ Lelongan masih berlangsung! Sila bida barang yang ada sekarang.` }, { quoted: m });

                const item = SENARAI_LELONG[Math.floor(Math.random() * SENARAI_LELONG.length)];
                
                bidaState[jid] = {
                    aktif: true,
                    dataItem: item,
                    hargaSemasa: item.minBid,
                    pembidaTertinggi: null
                };

                let msgLelong = `📢 *LELONGAN PASAR GELAP BERMULA!* 📢\n\n` +
                          `📦 *Item Lelong:* ${item.nama}\n` +
                          `💵 *Harga Mula:* RM ${item.minBid.toLocaleString()}\n` +
                          `⏳ *Masa Diberi:* 60 Saat\n\n` +
                          `👉 Taip \`.bida [jumlah]\` untuk berlawan harga!\nContoh: \`.bida ${item.minBid + 5000}\``;
                await sock.sendMessage(jid, { text: msgLelong });

                // Tamat lelongan (60 saat)
                setTimeout(async () => {
                    if (bidaState[jid] && bidaState[jid].aktif) {
                        const lelong = bidaState[jid];
                        bidaState[jid].aktif = false;
                        delete bidaState[jid];

                        if (!lelong.pembidaTertinggi) {
                            return sock.sendMessage(jid, { text: `🔨 Masa tamat! Tiada siapa yang berani membida *${lelong.dataItem.nama}*. Barang disimpan semula.` });
                        }

                        try {
                            const winner = await db.getUser(lelong.pembidaTertinggi);
                            
                            // Anti Cek Tendang
                            if (winner.wallet < lelong.hargaSemasa) {
                                winner.jail = { status: true, release_at: Date.now() + (5 * 60000), reason: "Bida Palsu / Cek Tendang" };
                                await db.saveUser(winner);
                                return sock.sendMessage(jid, { text: `🔨 *LELONGAN BATAL!*\n\n@${lelong.pembidaTertinggi.split('@')[0]} diseret polis ke lokap 5 minit kerana bidaan palsu (Duit poket tak cukup)!`, mentions: [lelong.pembidaTertinggi] });
                            }

                            // Tolak bayaran
                            winner.wallet -= lelong.hargaSemasa;
                            
                            let hadiahTeks = "";
                            const itemData = lelong.dataItem;

                            // LOGIK PENGAGIHAN GANJARAN MENGIKUT JENIS
                            if (itemData.jenis === 'tunai') {
                                const nilaiSebenar = Math.floor(Math.random() * (itemData.maxTunai - itemData.minTunai + 1)) + itemData.minTunai;
                                winner.wallet += nilaiSebenar;
                                const untung = nilaiSebenar - lelong.hargaSemasa;
                                const statusUntung = untung >= 0 ? `Untung RM ${untung.toLocaleString()} 📈` : `Rugi RM ${Math.abs(untung).toLocaleString()} 📉 (Kena Scam!)`;
                                hadiahTeks = `🔍 Nilai sebenar wang di dalam beg: *RM ${nilaiSebenar.toLocaleString()}*\n📊 *Status:* ${statusUntung}`;
                            } 
                            else if (itemData.jenis === 'kereta') {
                                winner.vehicle = { name: itemData.reward, speed: Math.floor(Math.random() * 80) + 150 }; // Masuk terus ke Garaj!
                                hadiahTeks = `🚗 *Tahniah!* Selepas kontena dibuka, kau menemui kunci *${itemData.reward}*!\nKenderaan telah pun dihantar ke dalam \`.garaj\` kau. Nilai pasaran kenderaan ini adalah RM ${itemData.nilaiPasaran.toLocaleString()}.`;
                            }
                            else if (itemData.jenis === 'emas') {
                                winner.emas = (winner.emas || 0) + itemData.reward;
                                hadiahTeks = `🪙 *Jackpot!* Peti besi berjaya dipecahkan dan kau menemui *${itemData.reward} Gram Emas* padu!\nEmas tersebut telah disimpan selamat di dalam \`.balance\`.`;
                            }
                            else if (itemData.jenis === 'btc') {
                                winner.btc = (winner.btc || 0) + itemData.reward;
                                hadiahTeks = `🖥️ *Jackpot Kripto!* Pelayan berjaya dihidupkan dan kau memindahkan *${itemData.reward} Unit BTC* terus ke \`.balance\` kau!`;
                            }

                            await db.saveUser(winner);

                            let winMsg = `🔨 *LELONGAN TAMAT! SOLD!* 🔨\n\n` +
                                         `👤 *Pemenang:* @${lelong.pembidaTertinggi.split('@')[0]}\n` +
                                         `💸 *Harga Dibayar:* RM ${lelong.hargaSemasa.toLocaleString()}\n\n` +
                                         `${hadiahTeks}`;

                            return sock.sendMessage(jid, { text: winMsg, mentions: [lelong.pembidaTertinggi] });

                        } catch (e) {
                            console.error("Lelong Timeout Error:", e);
                        }
                    }
                }, 60000); 
                return;
            }

            if (cmd === 'bida') {
                if (!bidaState[jid] || !bidaState[jid].aktif) return sock.sendMessage(jid, { text: `❌ Tiada lelongan berlangsung. Taip \`.mula_bida\`` }, { quoted: m });
                
                const bidAmount = parseInt(args[0]);
                if (isNaN(bidAmount)) return sock.sendMessage(jid, { text: `❌ Contoh format bidaan: \`.bida 50000\`` }, { quoted: m });
                if (user.wallet < bidAmount) return sock.sendMessage(jid, { text: `❌ Duit poket tak cukup nak bida RM ${bidAmount.toLocaleString()}!` }, { quoted: m });
                if (bidAmount <= bidaState[jid].hargaSemasa) return sock.sendMessage(jid, { text: `❌ Bidaan mesti LEBIH TINGGI dari RM ${bidaState[jid].hargaSemasa.toLocaleString()}!` }, { quoted: m });

                bidaState[jid].hargaSemasa = bidAmount;
                bidaState[jid].pembidaTertinggi = senderId;

                return sock.sendMessage(jid, { text: `📢 @${senderId.split('@')[0]} membida dengan harga *RM ${bidAmount.toLocaleString()}*!\nAda berani potong?`, mentions: [senderId] }, { quoted: m });
            }

        } catch (err) {
            console.error("Kutip/Bida Error:", err);
        }
    }
};
