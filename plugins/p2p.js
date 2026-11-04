const pasarP2P = []; // Memori pasaran semasa

export default {
    name: 'pasar_pemain',
    alias: ['p2p', 'jual_market', 'beli_market'],
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const senderJid = m.key.participant || jid;
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const args = teks.trim().split(' ').slice(1);
        const cmd = teks.slice(1).trim().split(' ')[0].toLowerCase();

        // 1. JUAL DI PASARAN P2P (.jual_market [kenderaan/bm] [id] [rm])
        if (cmd === 'jual_market') {
            const jenis = args[0]?.toLowerCase();
            const itemId = args[1]?.toLowerCase();
            const harga = parseInt(args[2]);

            if (!['kenderaan', 'bm'].includes(jenis) || !itemId || isNaN(harga) || harga <= 0) {
                return sock.sendMessage(jid, { 
                    text: '❌ Format: `.jual_market [kenderaan/bm] [id_item] [harga_rm]`' 
                }, { quoted: m });
            }

            const kodListing = Math.random().toString(36).substring(2, 7).toUpperCase();
            pasarP2P.push({
                listingId: kodListing,
                penjualJid: senderJid,
                namaPenjual: user.name,
                jenis,
                itemId,
                harga
            });

            return sock.sendMessage(jid, {
                text: `✅ *LISTING P2P BERJAYA!*\nBarang: *${itemId.toUpperCase()}*\nHarga: *RM ${harga.toLocaleString()}*\nKod Beli: *${kodListing}*`
            }, { quoted: m });
        }

        // 2. LIHAT PASARAN P2P (.pasar_pemain / .p2p)
        if (cmd === 'pasar_pemain' || cmd === 'p2p') {
            if (pasarP2P.length === 0) {
                return sock.sendMessage(jid, { text: '🛒 Pasaran lelongan P2P kosong buat masa ini.' }, { quoted: m });
            }

            let str = `┌───「 🛒 𝗣𝗔𝗦𝗔𝗥𝗔𝗡 𝗟𝗘𝗟𝗢𝗡𝗚𝗔𝗡 𝗣𝟮𝗣 」\n├───────────────────────────\n`;
            pasarP2P.forEach(item => {
                str += `├ 🔖 Kod: *${item.listingId}* (${item.jenis.toUpperCase()})\n│   📦 Item: ${item.itemId}\n│   👤 Penjual: ${item.namaPenjual}\n│   💵 Harga: RM ${item.harga.toLocaleString()}\n`;
            });
            str += `└───────────────────────────\nTaip \`.beli_market [Kod]\` untuk membeli barang!`;

            return sock.sendMessage(jid, { text: str }, { quoted: m });
        }

        // 3. BELI DARI PEMAIN LAIN (.beli_market [kod])
        if (cmd === 'beli_market') {
            const kod = args[0]?.toUpperCase();
            const index = pasarP2P.findIndex(p => p.listingId === kod);

            if (index === -1) return sock.sendMessage(jid, { text: '❌ Kod listing tidak sah atau sudah terjual!' }, { quoted: m });

            const brg = pasarP2P[index];
            if (brg.penjualJid === senderJid) return sock.sendMessage(jid, { text: '❌ Takkan nak beli barang sendiri bos!' }, { quoted: m });

            if (user.wallet < brg.harga) {
                return sock.sendMessage(jid, { text: `❌ Duit poket awak tak cukup RM ${brg.harga.toLocaleString()}!` }, { quoted: m });
            }

            // Tolak duit pembeli, tambah ke penjual
            user.wallet -= brg.harga;
            const penjual = await db.getUser(brg.penjualJid);
            penjual.wallet += brg.harga;

            await db.saveUser(user);
            await db.saveUser(penjual);
            pasarP2P.splice(index, 1);

            return sock.sendMessage(jid, {
                text: `🤝 *TRANSAKSI P2P SELESAI!*\nKau berjaya beli item *${brg.itemId}* dengan harga *RM ${brg.harga.toLocaleString()}* daripada *${brg.namaPenjual}*!`
            }, { quoted: m });
        }

        // 4. BIDA KONTENA MISTERI
        if (cmd === 'bida') {
            const bidaan = parseInt(args[0]);
            if (isNaN(bidaan) || bidaan <= 0) return sock.sendMessage(jid, { text: '❌ Masukkan jumlah bidaan!' }, { quoted: m });

            if (user.wallet < bidaan) return sock.sendMessage(jid, { text: '❌ Duit poket awak tidak mencukupi untuk membida!' }, { quoted: m });

            return sock.sendMessage(jid, {
                text: `📢 *BIDAAN DITERIMA!*\n@${senderJid.split('@')[0]} meletakkan bidaan sebanyak *RM ${bidaan.toLocaleString()}*!`,
                mentions: [senderJid]
            }, { quoted: m });
        }
    }
};
