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

            // FIX "Wayar Rosak": Paksa format array jika data lama rosak
            if (!user.bm_items || !Array.isArray(user.bm_items)) user.bm_items = [];
            if (!user.lastJenayah) user.lastJenayah = 0;

            const KATALOG_BM = {
                'master key': { harga: 30000, nama: 'Master Key Khas', buffItem: 'curi_kereta', buff: 25 },
                'laptop': { harga: 50000, nama: 'Hacker Laptop', buffItem: 'scam', buff: 25 },
                'gengster': { harga: 70000, nama: 'Gengster Upahan', buffItem: 'peras_ugut', buff: 25 },
                'lori': { harga: 100000, nama: 'Lori Hantu', buffItem: 'seludup', buff: 25 },
                'bug': { harga: 150000, nama: 'Spy Bug Mikro', buffItem: 'jual_maklumat', buff: 30 },
                'kontena': { harga: 250000, nama: 'Kontena Rahsia', buffItem: 'seludup_senjata', buff: 30 },
                'server': { harga: 400000, nama: 'Server Kuantum', buffItem: 'godam_kripto', buff: 35 },
                'm16': { harga: 600000, nama: 'M16 & Topeng', buffItem: 'rompak_bank', buff: 35 },
                'pelan': { harga: 1000000, nama: 'Pelan Lantai Kasino', buffItem: 'rompak_kasino', buff: 40 },
                'c4': { harga: 2000000, nama: 'C4 Explosive', buffItem: 'rompak_jongkong', buff: 45 }
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

            if (cmd === 'jenayah') {
                let ui = `╔═════════════════════════════╗\n    🏴‍☠️ 𝗞𝗔𝗥𝗧𝗘𝗟 𝗝𝗘𝗡𝗔𝗬𝗔𝗛 𝗔𝗜𝗥𝗜 🏴‍☠️\n╠═════════════════════════════╣\n`;
                let i = 1;
                for (const [kod, data] of Object.entries(JENAYAH_LIST)) {
                    const statusBuff = user.bm_items.includes(data.bm) ? '🔥' : '❌';
                    ui += `║ ${i++}. .${kod}\n║ ↳ Risiko: ${Math.round((1 - data.base) * 100)}% | Buff BM: ${statusBuff}\n`;
                }
                ui += `╚═════════════════════════════╝\n💡 *Tip:* Taip \`.bm\` untuk kurangkan risiko!`;
                return sock.sendMessage(jid, { text: ui }, { quoted: m });
            }

            if (cmd === 'bm') {
                let uiBM = `╔═════════════════════════════╗\n    🎪 𝗣𝗔𝗦𝗔𝗥 𝗚𝗘𝗟𝗔𝗣 (𝗕𝗟𝗔𝗖𝗞𝗠𝗔𝗥𝗞𝗘𝗧)\n╠═════════════════════════════╣\n`;
                for (const [kodBM, data] of Object.entries(KATALOG_BM)) {
                    uiBM += `║ 🛒 ${data.nama} (RM ${data.harga / 1000}k)\n║ ↳ Beli: \`.beli_bm ${kodBM}\`\n║ ↳ Efek: +${data.buff}% utk .${data.buffItem}\n╟─────────────────────────────\n`;
                }
                uiBM += `╚═════════════════════════════╝`;
                return sock.sendMessage(jid, { text: uiBM }, { quoted: m });
            }

            if (cmd === 'beli_bm') {
                const item = args[0]?.toLowerCase();
                const pilihan = KATALOG_BM[item];
                
                if (!pilihan) return sock.sendMessage(jid, { text: `❌ Kod barang tak wujud! Tengok senarai di \`.bm\`` }, { quoted: m });
                if (user.wallet < pilihan.harga) return sock.sendMessage(jid, { text: `❌ Duit poket tak cukup RM ${pilihan.harga.toLocaleString()}!` }, { quoted: m });
                if (user.bm_items.includes(pilihan.nama)) return sock.sendMessage(jid, { text: `✅ Kau dah ada ${pilihan.nama} dalam stor.` }, { quoted: m });

                user.wallet -= pilihan.harga;
                user.bm_items.push(pilihan.nama);
                await db.saveUser(user);
                return sock.sendMessage(jid, { text: `🎪 Transaksi gelap selesai.\n📦 *${pilihan.nama}* diseludup masuk inventori!` }, { quoted: m });
            }

            if (JENAYAH_LIST[cmd]) {
                const aksi = JENAYAH_LIST[cmd];
                if (now - user.lastJenayah < 300000) {
                    return sock.sendMessage(jid, { text: `🚨 Wanted level masih tinggi! Menyorok dulu selama ${Math.ceil((300000 - (now - user.lastJenayah)) / 1000)} saat.` }, { quoted: m });
                }
                if (user.wallet < aksi.modal) return sock.sendMessage(jid, { text: `❌ Modal pendahuluan RM ${aksi.modal.toLocaleString()} diperlukan.` }, { quoted: m });

                let totalSuccess = aksi.base + (user.bm_items.includes(aksi.bm) ? aksi.buff : 0);
                user.lastJenayah = now;

                if (Math.random() <= totalSuccess) {
                    const untung = Math.floor(Math.random() * (aksi.max - aksi.min + 1)) + aksi.min;
                    user.wallet -= aksi.modal; 
                    user.dirty_money = (user.dirty_money || 0) + untung; 
                    await db.saveUser(user);
                    return sock.sendMessage(jid, { text: `🏴‍☠️ *JACKPOT!*\nKau sebat RM ${untung.toLocaleString()} duit haram!\n💦 Cuci duit tu cepat guna \`.cuci_duit\`.` }, { quoted: m });
                } else {
                    user.wallet -= aksi.modal; 
                    user.jail = { status: true, release_at: Date.now() + (aksi.jail * 1000), reason: `Dicekup waktu ${cmd}` };
                    await db.saveUser(user);
                    return sock.sendMessage(jid, { text: `🚨 *BUSTED!*\nPolis gempur lokasi! Modal lebur, masuk lokap ${aksi.jail} saat.` }, { quoted: m });
                }
            }
        } catch (err) {
            console.error("Jenayah Mega Error:", err);
            return sock.sendMessage(m.key.remoteJid, { text: `❌ Sistem Kartel Error: Sila lapor pada Bos Amar.` }, { quoted: m });
        }
    }
};
