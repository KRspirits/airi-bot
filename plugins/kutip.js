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
    { nama: "🪙 Peti Besi Pejabat Tanah Lama", jenis: 'emas', reward: 500, nilaiPasaran: 150000, minBid: 25000 },
    { nama: "🖥️ Pelayan PC Godam PDRM", jenis: 'btc', reward: 2, nilaiPasaran: 500000, minBid: 100000 }
];

export async function triggerSpeedDrop(sock, targetGroup) {
    // Tanam memori di dalam sock supaya tidak hilang bila fail di-reload
    if (!sock.kutipState) sock.kutipState = {};
    const kutipDB = sock.kutipState;

    const kodRahsia = Math.floor(Math.random() * 900) + 100; 
    const jumlahWang = Math.floor(Math.random() * 50000) + 10000;

    kutipDB[targetGroup] = { aktif: true, kod: kodRahsia, jumlah: jumlahWang };

    let msg = `┌───「 🚚 𝗧𝗥𝗔𝗞 𝗦𝗘𝗞𝗨𝗥𝗜𝗧𝗜 𝗧𝗘𝗥𝗕𝗔𝗟𝗜𝗞! 」\n` +
              `│ *Pintu belakang van keselamatan pecah di lebuh raya!*\n` +
              `├───────────────────────────\n` +
              `├ 💰 Wang Tercicir : RM ${jumlahWang.toLocaleString()}\n` +
              `├ ⚡ Tindakan Pantas: Taip kod di bawah terpantas!\n` +
              `└───────────────────────────\n\n` +
              `👉 Taip segera: \`.kutip ${kodRahsia}\``;

    await sock.sendMessage(targetGroup, { text: msg });

    setTimeout(() => {
        if (kutipDB[targetGroup] && kutipDB[targetGroup].aktif) {
            delete kutipDB[targetGroup];
            sock.sendMessage(targetGroup, { text: `☁️ Orang ramai dah sapu habis semua duit! Tiada siapa yang sempat kutip.` }).catch(() => {});
        }
    }, 30000);
}

export default {
    name: 'kutip',
    alias: ['grab', 'ambil', 'mula_bida', 'lelong'],
    execute: async ({ sock, m, user, db }) => {
        try {
            const jid = m.key.remoteJid;
            const senderId = m.key.participant || jid;
            const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
            const args = teks.trim().split(' ').slice(1);
            const cmd = teks.slice(1).trim().split(' ')[0].toLowerCase();

            // Init state storage kebal reload
            if (!sock.bidaState) sock.bidaState = {};
            if (!sock.kutipState) sock.kutipState = {};
            const bidaDB = sock.bidaState;
            const kutipDB = sock.kutipState;

            // ============================================
            // 1. SISTEM KUTIP TRAK TERBALIK
            // ============================================
            if (cmd === 'kutip' || cmd === 'grab' || cmd === 'ambil') {
                const kodMasuk = parseInt(args[0]);
                if (!kutipDB[jid] || !kutipDB[jid].aktif) return sock.sendMessage(jid, { text: `❌ Tiada trak duit terbalik buat masa ni.` }, { quoted: m });
                if (isNaN(kodMasuk) || kodMasuk !== kutipDB[jid].kod) return sock.sendMessage(jid, { text: `❌ Kod salah! Cepat cuba lagi sebelum orang lain rembat.` }, { quoted: m });

                const hadiah = kutipDB[jid].jumlah;
                delete kutipDB[jid]; 

                user.wallet = (user.wallet || 0) + hadiah;
                await db.saveUser(user);

                return sock.sendMessage(jid, { text: `⚡ *PANTAS!* @${senderId.split('@')[0]} berjaya menyambar beg duit sebanyak *RM ${hadiah.toLocaleString()}* dari tengah lebuh raya!`, mentions: [senderId] }, { quoted: m });
            }

            // ============================================
            // 2. SISTEM LELONGAN BIDA (ITEM/KERETA/ASET)
            // ============================================
            if (cmd === 'mula_bida' || cmd === 'lelong' || (cmd === 'bida' && args[0]?.toLowerCase() === 'mula')) {
                if (bidaDB[jid] && bidaDB[jid].aktif) return sock.sendMessage(jid, { text: `❌ Lelongan masih berlangsung! Sila bida barang yang ada sekarang.` }, { quoted: m });

                const item = SENARAI_LELONG[Math.floor(Math.random() * SENARAI_LELONG.length)];
                
                bidaDB[jid] = {
                    aktif: true,
                    dataItem: item,
                    hargaSemasa: item.minBid,
                    pemenang: null // Simpan ID pemenang
                };

                let msgLelong = `📢 *LELONGAN PASAR GELAP BERMULA!* 📢\n\n` +
                          `📦 *Item Lelong:* ${item.nama}\n` +
                          `💵 *Harga Mula:* RM ${item.minBid.toLocaleString()}\n` +
                          `⏳ *Masa Diberi:* 60 Saat\n\n` +
                          `👉 Taip \`.bida [jumlah]\` untuk berlawan harga!\nContoh: \`.bida ${item.minBid + 5000}\``;
                await sock.sendMessage(jid, { text: msgLelong });

                // Tamat lelongan (60 saat)
                setTimeout(async () => {
                    if (bidaDB[jid] && bidaDB[jid].aktif) {
                        const lelong = bidaDB[jid];
                        const idPemenang = lelong.pemenang;
                        const hargaAkhir = lelong.hargaSemasa;
                        const itemData = lelong.dataItem;
                        
                        bidaDB[jid].aktif = false; // Kunci lelongan

                        if (!idPemenang) {
                            delete bidaDB[jid];
                            return sock.sendMessage(jid, { text: `🔨 Masa tamat! Tiada siapa yang berani membida *${itemData.nama}*. Barang disimpan semula.` });
                        }

                        try {
                            const winner = await db.getUser(idPemenang);
                            
                            // Logik Anti Cek Tendang (Duit tak cukup masa menang)
                            if ((winner.wallet || 0) < hargaAkhir) {
                                winner.jail = { status: true, release_at: Date.now() + (5 * 60000), reason: "Bida Palsu / Cek Tendang" };
                                await db.saveUser(winner);
                                delete bidaDB[jid];
                                return sock.sendMessage(jid, { text: `🔨 *LELONGAN BATAL!*\n\n@${idPemenang.split('@')[0]} diseret polis ke lokap 5 minit kerana bidaan palsu (Duit poket tiba-tiba tak cukup)!`, mentions: [idPemenang] });
                            }

                            // Tolak bayaran
                            winner.wallet -= hargaAkhir;
                            
                            let hadiahTeks = "";

                            // LOGIK PENGAGIHAN GANJARAN MENGIKUT JENIS
                            if (itemData.jenis === 'tunai') {
                                const nilaiSebenar = Math.floor(Math.random() * (itemData.maxTunai - itemData.minTunai + 1)) + itemData.minTunai;
                                winner.wallet += nilaiSebenar;
                                const untung = nilaiSebenar - hargaAkhir;
                                const statusUntung = untung >= 0 ? `Untung RM ${untung.toLocaleString()} 📈` : `Rugi RM ${Math.abs(untung).toLocaleString()} 📉 (Kena Scam!)`;
                                hadiahTeks = `🔍 Nilai sebenar wang di dalam beg: *RM ${nilaiSebenar.toLocaleString()}*\n📊 *Status:* ${statusUntung}`;
                            } 
                            else if (itemData.jenis === 'kereta') {
                                winner.vehicle = { name: itemData.reward, speed: Math.floor(Math.random() * 80) + 150 }; // Masuk terus ke Garaj
                                hadiahTeks = `🚗 *Tahniah!* Selepas kontena dibuka, awak menemui kunci *${itemData.reward}*!\nKenderaan telah pun dihantar ke dalam \`.garaj\` awak. Nilai pasaran kenderaan ini adalah RM ${itemData.nilaiPasaran.toLocaleString()}.`;
                            }
                            else if (itemData.jenis === 'emas') {
                                winner.emas = (winner.emas || 0) + itemData.reward;
                                hadiahTeks = `🪙 *Jackpot!* Peti besi berjaya dipecahkan dan awak menemui *${itemData.reward} Gram Emas* padu!\nEmas tersebut telah disimpan selamat di dalam \`.balance\`.`;
                            }
                            else if (itemData.jenis === 'btc') {
                                winner.btc = (winner.btc || 0) + itemData.reward;
                                hadiahTeks = `🖥️ *Jackpot Kripto!* Pelayan berjaya dihidupkan dan awak memindahkan *${itemData.reward} Unit BTC* terus ke \`.balance\` awak!`;
                            }

                            if (typeof winner.markModified === 'function') winner.markModified('vehicle');
                            await db.saveUser(winner);
                            delete bidaDB[jid]; // Clear memori lelongan

                            let winMsg = `🔨 *LELONGAN TAMAT! SOLD!* 🔨\n\n` +
                                         `👤 *Pemenang:* @${idPemenang.split('@')[0]}\n` +
                                         `💸 *Harga Dibayar:* RM ${hargaAkhir.toLocaleString()}\n\n` +
                                         `${hadiahTeks}`;

                            return sock.sendMessage(jid, { text: winMsg, mentions: [idPemenang] });

                        } catch (e) {
                            console.error("Lelong Timeout Error:", e);
                            delete bidaDB[jid];
                        }
                    }
                }, 60000); 
                return;
            }

            if (cmd === 'bida') {
                if (!bidaDB[jid] || !bidaDB[jid].aktif) return sock.sendMessage(jid, { text: `❌ Tiada lelongan berlangsung. Taip \`.lelong\`` }, { quoted: m });
                
                const bidAmount = parseInt(args[0]);
                if (isNaN(bidAmount)) return sock.sendMessage(jid, { text: `❌ Contoh format bidaan: \`.bida 50000\`` }, { quoted: m });
                if ((user.wallet || 0) < bidAmount) return sock.sendMessage(jid, { text: `❌ Duit poket tak cukup nak bida RM ${bidAmount.toLocaleString()}!` }, { quoted: m });
                if (bidAmount <= bidaDB[jid].hargaSemasa) return sock.sendMessage(jid, { text: `❌ Bidaan mesti LEBIH TINGGI dari RM ${bidaDB[jid].hargaSemasa.toLocaleString()}!` }, { quoted: m });

                bidaDB[jid].hargaSemasa = bidAmount;
                bidaDB[jid].pemenang = senderId; // Lock ID Pembida

                return sock.sendMessage(jid, { text: `📢 *BIDAAN DITERIMA!*\n@${senderId.split('@')[0]} meletakkan bidaan sebanyak *RM ${bidAmount.toLocaleString()}*!`, mentions: [senderId] }, { quoted: m });
            }

        } catch (err) {
            console.error("Kutip/Bida Error:", err);
        }
    }
};
