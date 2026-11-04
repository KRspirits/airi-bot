// Memori global berasingan khas untuk Lelongan Kontena
const lelongGlobalState = {};

export default {
    name: 'lelong_kontena',
    alias: [],
    execute: async ({ sock, m, user, db }) => {
        try {
            const jid = m.key.remoteJid;
            const senderJid = m.key.participant || jid;
            const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
            const args = teks.trim().split(' ').slice(1);
            const cmd = teks.slice(1).trim().split(' ')[0].toLowerCase();

            // 1. ARAHAN UNTUK MULA LELONGAN (.lelong_kontena)
            if (cmd === 'lelong_kontena') {
                if (lelongGlobalState[jid] && lelongGlobalState[jid].aktif) {
                    return sock.sendMessage(jid, { text: `⚠️ Lelongan kontena sedang aktif! Taip \`.bida [jumlah]\` untuk merebutnya sekarang!` }, { quoted: m });
                }

                // Tetapkan data asas lelongan baharu
                lelongGlobalState[jid] = {
                    aktif: true,
                    hargaTertinggi: 10000,
                    pemenang: null
                };

                let intro = `📦 *LELONGAN KONTENA MISTERI BERMULA!* 📦\n\n` +
                            `⚠️ *Peringatan:* Isi kontena boleh jadi *HARTA JUTAAN RINGGIT* atau *HABUK KOSONG!*\n\n` +
                            `💵 Harga Buka: *RM 10,000*\n` +
                            `⏱️ Tempoh Bidaan: *60 Saat*\n\n` +
                            `👉 Taip segera: \`.bida [jumlah_rm]\``;

                await sock.sendMessage(jid, { text: intro });

                // Pemasa undur 60 saat
                setTimeout(async () => {
                    const stateGrup = lelongGlobalState[jid];
                    if (!stateGrup || !stateGrup.aktif) return;

                    if (!stateGrup.pemenang) {
                        await sock.sendMessage(jid, { text: `🔔 *LELONGAN TAMAT!*\n\nTiada sesiapa yang meletakkan sebarang bidaan. Kontena ditarik balik.` });
                    } else {
                        // Ambil data pemenang terkini dari database
                        const pemenangUser = await db.getUser(stateGrup.pemenang);
                        
                        // Tolak duit dari wallet pemenang
                        pemenangUser.wallet -= stateGrup.hargaTertinggi;

                        // Sistem RNG Hadiah Kontena
                        const rng = Math.random();
                        let bentukHadiah = '';
                        let nilaiHadiah = 0;

                        if (rng < 0.10) { // 10% Jackpot Mega
                            nilaiHadiah = Math.floor(Math.random() * (5000000 - 1000000 + 1)) + 1000000;
                            bentukHadiah = `🌟 *JACKPOT! EMAS JONGKONG & WANG TUNAI!*`;
                        } else if (rng < 0.50) { // 40% Untung Sederhana
                            nilaiHadiah = Math.floor(Math.random() * (500000 - 50000 + 1)) + 50000;
                            bentukHadiah = `✨ *BARANG ELEKTRONIK & ASET BERHARGA!*`;
                        } else { // 50% Habuk / Rugi
                            nilaiHadiah = Math.floor(Math.random() * 5000);
                            bentukHadiah = `🗑️ *HABUK KOSONG & BESI BURUK!*`;
                        }

                        pemenangUser.wallet += nilaiHadiah;
                        await db.saveUser(pemenangUser);

                        let mesejMenang = `🔔 *LELONGAN KONTENA TAMAT!* 🔔\n\n` +
                                          `Bidaan tertinggi dimenangi pada harga: *RM ${stateGrup.hargaTertinggi.toLocaleString()}*\n` +
                                          `Pemenang: @${stateGrup.pemenang.split('@')[0]}\n\n` +
                                          `🔓 *KONTENA DIBUKA...*\n` +
                                          `${bentukHadiah}\n` +
                                          `💰 Nilai Isi Kontena: *RM ${nilaiHadiah.toLocaleString()}*`;

                        await sock.sendMessage(jid, { text: mesejMenang, mentions: [stateGrup.pemenang] });
                    }

                    // Padam memori lelongan lepas tamat
                    delete lelongGlobalState[jid];
                }, 60000);

                return;
            }

            // 2. ARAHAN UNTUK MEMBIDA (.bida)
            if (cmd === 'bida') {
                if (!lelongGlobalState[jid] || !lelongGlobalState[jid].aktif) {
                    return sock.sendMessage(jid, { text: `❌ Tiada sesi lelongan kontena yang sedang berjalan sekarang.` }, { quoted: m });
                }

                const nilaiBidaan = parseInt(args[0]);
                if (isNaN(nilaiBidaan) || nilaiBidaan <= 0) {
                    return sock.sendMessage(jid, { text: `❌ Format salah! Contoh: \`.bida 51000\`` }, { quoted: m });
                }

                const hargaSemasa = lelongGlobalState[jid].hargaTertinggi;

                if (nilaiBidaan <= hargaSemasa) {
                    return sock.sendMessage(jid, { text: `📉 Bidaan terlalu rendah! Harga bidaan semasa ialah *RM ${hargaSemasa.toLocaleString()}*` }, { quoted: m });
                }

                if (user.wallet < nilaiBidaan) {
                    return sock.sendMessage(jid, { text: `💸 Duit tunai poket awak tidak cukup RM ${nilaiBidaan.toLocaleString()} untuk membida sebanyak ini!` }, { quoted: m });
                }

                // Kemaskini data bidaan dalam memori global secara langsung
                lelongGlobalState[jid].hargaTertinggi = nilaiBidaan;
                lelongGlobalState[jid].pemenang = senderJid;

                return sock.sendMessage(jid, { 
                    text: `📢 *BIDAAN DITERIMA!*\n\n@${senderJid.split('@')[0]} meletakkan bidaan sebanyak *RM ${nilaiBidaan.toLocaleString()}*!\nAda lagi yang nak lawan?`, 
                    mentions: [senderJid] 
                }, { quoted: m });
            }

        } catch (err) {
            console.error("Lelong Plugin Error:", err);
        }
    }
};
