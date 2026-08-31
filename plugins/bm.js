const BM_CATALOG = {
    '1': { nama: 'Topeng Muka Hacker', harga: 50000, buff: 0.10, ket: '-10% Risiko Jenayah' },
    '2': { nama: 'Kabel Orang Dalam', harga: 150000, buff: 0.20, ket: '-20% Risiko Jenayah' },
    '3': { nama: 'Alibi Palsu VVIP', harga: 300000, buff: 0.35, ket: '-35% Risiko Jenayah' },
    '4': { nama: 'Sindiket Kebal Duit', harga: 800000, buff: 0.50, ket: '-50% Risiko Jenayah' }
};

export default {
    name: 'bm',
    alias: ['pasar_gelap', 'beli_bm'],
    execute: async ({ sock, m, user, db }) => {
        try {
            const jid = m.key.remoteJid;
            const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
            const args = teks.trim().split(' ').slice(1);
            const cmd = teks.slice(1).trim().split(' ')[0].toLowerCase();

            // Sediakan struktur inventory jika kosong
            if (!user.inventory) user.inventory = {};
            if (!user.inventory.bm_buff) {
                user.inventory.bm_buff = { nama: 'Tiada', perlindungan: 0 };
            }

            // 1. PAPAR MENU PASAR GELAP (.bm / .pasar_gelap)
            if (cmd === 'bm' || cmd === 'pasar_gelap') {
                let ui = `╔═════════════════════════════╗\n` +
                         `    🏴‍☠️ 𝗣𝗔𝗦𝗔𝗥 𝗚𝗘𝗟𝗔𝗣 (𝗕𝗟𝗔𝗖Ｋ 𝗠𝗔𝗥𝗞𝗘𝗧)\n` +
                         `╠═════════════════════════════╣\n\n` +
                         `⚠️ Beli alat perlindungan di sini untuk kurangkan risiko kantoi polis semasa buat \`.jenayah\`!\n\n`;

                for (const [id, item] of Object.entries(BM_CATALOG)) {
                    ui += `[${id}] ${item.nama}\n ↳ Harga: RM ${item.harga.toLocaleString()}\n ↳ Efek: ${item.ket}\n\n`;
                }

                ui += `🛠️ **Buff Semasa:** ${user.inventory.bm_buff.nama} (-${user.inventory.bm_buff.perlindungan * 100}% Risiko)\n` +
                      `🛒 **Cara Beli:** \`.beli_bm [nombor]\`\nContoh: \`.beli_bm 2\``;

                return sock.sendMessage(jid, { text: ui }, { quoted: m });
            }

            // 2. BELI BARANG GELAP (.beli_bm)
            if (cmd === 'beli_bm') {
                const id = args[0];
                if (!id || !BM_CATALOG[id]) {
                    return sock.sendMessage(jid, { text: `❌ Sila letak kod nombor barang yang betul. Taip \`.bm\` untuk tengok senarai.` }, { quoted: m });
                }

                const item = BM_CATALOG[id];
                
                if (user.wallet < item.harga) {
                    return sock.sendMessage(jid, { text: `❌ Duit tunai poket tak cukup RM ${item.harga.toLocaleString()} untuk berurus niaga di pasar gelap!` }, { quoted: m });
                }

                // Tolak duit & update buff
                user.wallet -= item.harga;
                user.inventory.bm_buff = {
                    nama: item.nama,
                    perlindungan: item.buff
                };

                // Paksa save ke database
                if (typeof user.markModified === 'function') {
                    user.markModified('inventory');
                }
                await db.saveUser(user);

                return sock.sendMessage(jid, { text: `✅ Transaksi haram berjaya!\n\nKau telah pasang *${item.nama}*. Risiko kantoi buat jenayah sekarang dikurangkan sebanyak **${item.buff * 100}%**.` }, { quoted: m });
            }

        } catch (err) {
            console.error("Black Market Error:", err);
            return sock.sendMessage(m.key.remoteJid, { text: `Sistem Pasar Gelap rosak! Hubungi @Shadow Legacy` }, { quoted: m });
        }
    }
};
