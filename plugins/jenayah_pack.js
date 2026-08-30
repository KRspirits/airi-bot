export default {
    name: 'jenayah_pack',
    alias: [
        'jenayah', 'bm', 'beli_bm', 
        'curi_kereta', 'scam', 'peras_ugut', 'seludup', 'jual_maklumat', 
        'seludup_senjata', 'godam_kripto', 'rompak_bank', 'rompak_kasino', 'rompak_jongkong'
    ],
    execute: async ({ sock, m, user, db }) => {
        try {
            const jid = m.key.remoteJid;
            const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
            const args = teks.trim().split(' ').slice(1);
            const cmd = teks.slice(1).trim().split(' ')[0].toLowerCase();
            const now = Date.now();

            if (!user.bm_items) user.bm_items = [];
            if (!user.lastJenayah) user.lastJenayah = 0;

            const KATALOG_BM = {
                'master key': { harga: 30000, nama: 'Master Key Khas', buffItem: 'curi_kereta' },
                'laptop': { harga: 50000, nama: 'Hacker Laptop', buffItem: 'scam' },
                'gengster': { harga: 70000, nama: 'Gengster Upahan', buffItem: 'peras_ugut' },
                'lori': { harga: 100000, nama: 'Lori Hantu', buffItem: 'seludup' },
                'bug': { harga: 150000, nama: 'Spy Bug Mikro', buffItem: 'jual_maklumat' },
                'kontena': { harga: 250000, nama: 'Kontena Rahsia', buffItem: 'seludup_senjata' },
                'server': { harga: 400000, nama: 'Server Kuantum', buffItem: 'godam_kripto' },
                'm16': { harga: 600000, nama: 'M16 & Topeng', buffItem: 'rompak_bank' },
                'pelan': { harga: 1000000, nama: 'Pelan Lantai Kasino', buffItem: 'rompak_kasino' },
                'c4': { harga: 2000000, nama: 'C4 Explosive', buffItem: 'rompak_jongkong' }
            };

            const JENAYAH_LIST = {
                'curi_kereta': { modal: 0, min: 20000, max: 50000, base: 0.60, jail: 60, bm: 'Master Key Khas', buff: 0.25 },
                'scam': { modal: 0, min: 40000, max: 90000, base: 0.55, jail: 120, bm: 'Hacker Laptop', buff: 0.25 },
                'peras_ugut': { modal: 0, min: 50000, max: 120000, base: 0.50, jail: 150, bm: 'Gengster Upahan', buff: 0.25 },
                'seludup': { modal: 20000, min: 100000, max: 250000, base: 0.45, jail: 180, bm: 'Lori Hantu', buff: 0.25 },
                'jual_maklumat': { modal: 10000, min: 150000, max: 350000, base: 0.40, jail: 200, bm: 'Spy Bug Mikro', buff: 0.30 },
                'seludup_senjata': { modal: 50000, min: 300000, max: 800000, base: 0.35, jail: 300, bm: 'Kontena Rahsia', buff: 0.30 },
                'godam_kripto': { modal: 0, min: 500000, max: 1200000, base: 0.30, jail: 400, bm: 'Server Kuantum', buff: 0.35 },
                'rompak_bank': { modal: 0, min: 800000, max: 2000000, base: 0.25, jail: 500, bm: 'M16 & Topeng', buff: 0.35 },
                'rompak_kasino': { modal: 100000, min: 1500000, max: 4000000, base: 0.20, jail: 600, bm: 'Pelan Lantai Kasino', buff: 0.40 },
                'rompak_jongkong': { modal: 250000, min: 3000000, max: 10000000, base: 0.15, jail: 900, bm: 'C4 Explosive', buff: 0.45 }
            };

            // 1. MENU JENAYAH
            if (cmd === 'jenayah') {
                let senarai = `🏴‍☠️ *KARTEL JENAYAH AIRI*\n\n`;
                let i = 1;
                for (const [kod, data] of Object.entries(JENAYAH_LIST)) {
                    senarai += `${i++}. *.${kod}*\n   Modal: RM ${(data.modal/1000)}k | Untung: RM ${(data.min/1000)}k-RM ${(data.max/1000000 >= 1 ? (data.max/1000000).toFixed(1)+'m' : (data.max/1000)+'k')} | Risiko: ${Math.round((1 - data.base) * 100)}%\n`;
                }
                senarai += `\n💡 *Tip:* Beli barang di Pasar Gelap (\`.bm\`) untuk tambah peluang menang!`;
                return sock.sendMessage(jid, { text: senarai }, { quoted: m });
            }

            // 2. PASAR GELAP (BLACKMARKET)
            if (cmd === 'bm') {
                let senaraiBM = `🎪 *PASAR GELAP (BLACKMARKET)*\n\n`;
                for (const [kodBM, data] of Object.entries(KATALOG_BM)) {
                    senaraiBM += `🛒 *${data.nama}* - RM ${(data.harga).toLocaleString()}\n   └ Beli: \`.beli_bm ${kodBM}\`\n   └ Buff: +${(JENAYAH_LIST[data.buffItem].buff * 100)}% untuk .${data.buffItem}\n\n`;
                }
                return sock.sendMessage(jid, { text: senaraiBM.trim() }, { quoted: m });
            }

            if (cmd === 'beli_bm') {
                const item = args[0]?.toLowerCase(); // Guna keyword pertama je untuk mudah
                const pilihan = KATALOG_BM[item];
                
                if (!pilihan) return sock.sendMessage(jid, { text: `❌ Barang tak wujud! Taip \`.bm\` untuk tengok senarai keyword belian yang betul.` }, { quoted: m });
                if (user.wallet < pilihan.harga) return sock.sendMessage(jid, { text: `❌ Duit poket tak cukup RM ${pilihan.harga.toLocaleString()}!` }, { quoted: m });
                if (user.bm_items.includes(pilihan.nama)) return sock.sendMessage(jid, { text: `✅ Kau dah simpan ${pilihan.nama} dalam stor. Tak payah beli lagi.` }, { quoted: m });

                user.wallet -= pilihan.harga;
                user.bm_items.push(pilihan.nama);
                await db.saveUser(user);
                return sock.sendMessage(jid, { text: `🎪 Transaksi gelap selesai, Amar.\n\n📦 *${pilihan.nama}* selamat diseludup masuk ke dalam inventori kau!` }, { quoted: m });
            }

            // 3. SISTEM JENAYAH DINAMIK (10 JENIS)
            if (JENAYAH_LIST[cmd]) {
                const aksi = JENAYAH_LIST[cmd];

                // Cooldown 5 Minit untuk beri masa polis reda
                if (now - user.lastJenayah < 300000) {
                    const sisa = Math.ceil((300000 - (now - user.lastJenayah)) / 1000);
                    return sock.sendMessage(jid, { text: `🚨 Wanted level masih tinggi! Menyorok dulu selama ${sisa} saat sebelum sambung kerja gila.` }, { quoted: m });
                }

                if (user.wallet < aksi.modal) return sock.sendMessage(jid, { text: `❌ Modal tak cukup! Kau perlukan RM ${aksi.modal.toLocaleString()} untuk biaya kos awal.` }, { quoted: m });

                let totalSuccess = aksi.base;
                let adaBuff = false;
                if (user.bm_items.includes(aksi.bm)) {
                    totalSuccess += aksi.buff;
                    adaBuff = true;
                }

                user.lastJenayah = now;
                const nasib = Math.random();

                if (nasib <= totalSuccess) {
                    const untung = Math.floor(Math.random() * (aksi.max - aksi.min + 1)) + aksi.min;
                    user.wallet -= aksi.modal; // Tolak modal
                    user.dirty_money = (user.dirty_money || 0) + untung; // Masuk duit haram
                    await db.saveUser(user);
                    
                    const teksBuff = adaBuff ? `\n🔥 Buff Aktif: *${aksi.bm}* buat kerja kau sangat licik!` : '';
                    return sock.sendMessage(jid, { text: `🏴‍☠️ *JACKPOT JENAYAH!*\n\nKerja bersih! Kau sebat RM ${untung.toLocaleString()} duit haram!${teksBuff}\n💦 Cuci duit tu cepat guna \`.cuci_duit\` sebelum kantoi.` }, { quoted: m });
                } else {
                    user.wallet -= aksi.modal; // Modal hangus
                    user.jail = { status: true, release_at: Date.now() + (aksi.jail * 1000), reason: `Dicekup waktu buat ${cmd}` };
                    await db.saveUser(user);
                    
                    return sock.sendMessage(jid, { text: `🚨 *AMARAN: BUSTED!*\n\nOperasi kau digempur unit taktikal PDRM! Modal lebur dan kau disumbat ke lokap selama ${aksi.jail} saat!` }, { quoted: m });
                }
            }

        } catch (err) {
            console.error("Jenayah Mega Error:", err);
        }
    }
};
