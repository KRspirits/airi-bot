import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('./database_bm.json');
let bmDB = {};
try { if (fs.existsSync(dbPath)) bmDB = JSON.parse(fs.readFileSync(dbPath, 'utf8')); } catch (e) {}

const BM_CATALOG = {
    '1': { nama: 'Topeng Hacker', harga: 50000, buff: 0.10, ket: '-10% Risiko Jenayah' },
    '2': { nama: 'Kabel Orang Dalam', harga: 150000, buff: 0.20, ket: '-20% Risiko Jenayah' },
    '3': { nama: 'Alibi VVIP', harga: 300000, buff: 0.35, ket: '-35% Risiko Jenayah' },
    '4': { nama: 'Sindiket Kebal', harga: 800000, buff: 0.50, ket: '-50% Risiko Jenayah' }
};

export default {
    name: 'bm',
    alias: ['pasar_gelap', 'beli_bm'],
    execute: async ({ sock, m, user, db }) => {
        try {
            const jid = m.key.remoteJid;
            const senderId = m.key.participant || jid;
            const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
            const args = teks.trim().split(' ').slice(1);
            const cmd = teks.slice(1).trim().split(' ')[0].toLowerCase();

            if (!bmDB[senderId]) bmDB[senderId] = { nama: 'Tiada', perlindungan: 0 };
            const pData = bmDB[senderId];

            if (cmd === 'bm' || cmd === 'pasar_gelap') {
                let ui = `╔═════════════════════════════╗\n` +
                         `    🏴‍☠️ 𝗣𝗔𝗦𝗔𝗥 𝗚𝗘𝗟𝗔𝗣 (𝗕𝗟𝗔𝗖Ｋ 𝗠𝗔𝗥𝗞𝗘𝗧)\n` +
                         `╠═════════════════════════════╣\n\n` +
                         `⚠️ Beli barang perlindungan di sini untuk kurangkan risiko \`.jenayah\`!\n\n`;

                for (const [id, item] of Object.entries(BM_CATALOG)) {
                    ui += `[${id}] ${item.nama}\n ↳ Harga: RM ${item.harga.toLocaleString()}\n ↳ Efek: ${item.ket}\n\n`;
                }

                ui += `🛠️ *Buff Semasa:* ${pData.nama} (-${pData.perlindungan * 100}% Risiko)\n` +
                      `🛒 *Cara Beli:* \`.beli_bm [no]\` (Contoh: \`.beli_bm 2\`)`;

                return sock.sendMessage(jid, { text: ui }, { quoted: m });
            }

            if (cmd === 'beli_bm') {
                const id = args[0];
                if (!id || !BM_CATALOG[id]) return sock.sendMessage(jid, { text: `❌ Kod nombor salah! Taip \`.bm\`` }, { quoted: m });
                
                const item = BM_CATALOG[id];
                if (user.wallet < item.harga) return sock.sendMessage(jid, { text: `❌ Duit poket tak cukup RM ${item.harga.toLocaleString()}!` }, { quoted: m });

                user.wallet -= item.harga;
                bmDB[senderId] = { nama: item.nama, perlindungan: item.buff };
                
                fs.writeFileSync(dbPath, JSON.stringify(bmDB, null, 2));
                await db.saveUser(user);

                return sock.sendMessage(jid, { text: `✅ Transaksi haram berjaya!\n\nKau telah pasang *${item.nama}*. Risiko kantoi buat jenayah diturunkan sebanyak **${item.buff * 100}%**.` }, { quoted: m });
            }
        } catch (err) {
            console.error("BM Error:", err);
        }
    }
};
