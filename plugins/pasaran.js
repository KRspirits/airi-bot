// Memori pasaran global (Reset bila bot direstart, terapung setiap 5 minit)
const marketState = {
    btc: 250000,
    emas: 350,
    trendBtc: '📈',
    trendEmas: '📈',
    lastUpdate: 0
};

function updateMarket() {
    const now = Date.now();
    // Harga bergoyang setiap 5 minit (300000ms)
    if (now - marketState.lastUpdate > 300000) {
        const oldBtc = marketState.btc;
        const oldEmas = marketState.emas;

        // BTC: RM 150,000 - RM 400,000
        marketState.btc = Math.floor(Math.random() * (400000 - 150000 + 1)) + 150000;
        // Emas: RM 300 - RM 450 per gram
        marketState.emas = Math.floor(Math.random() * (450 - 300 + 1)) + 300;

        marketState.trendBtc = marketState.btc >= oldBtc ? '📈 Naik' : '📉 Turun';
        marketState.trendEmas = marketState.emas >= oldEmas ? '📈 Naik' : '📉 Turun';
        marketState.lastUpdate = now;
    }
}

export default {
    name: 'pasaran',
    alias: ['beli_btc', 'jual_btc', 'beli_emas', 'jual_emas'],
    execute: async ({ sock, m, user, db }) => {
        try {
            const jid = m.key.remoteJid;
            const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
            const args = teks.trim().split(' ').slice(1);
            const cmd = teks.slice(1).trim().split(' ')[0].toLowerCase();

            updateMarket(); // Trigger update harga terkini

            if (cmd === 'pasaran') {
                let ui = `╔═════════════════════════════╗\n` +
                         `    📊 𝗣𝗔𝗦𝗔𝗥𝗔𝗡 𝗦𝗔𝗛𝗔𝗠 & 𝗞𝗥𝗜𝗣𝗧𝗢\n` +
                         `╠═════════════════════════════╣\n\n` +
                         `🪙 *Emas Fizikal (1 Gram)*\n` +
                         ` ↳ Harga: RM ${marketState.emas.toLocaleString()}\n` +
                         ` ↳ Trend: ${marketState.trendEmas}\n\n` +
                         `₿ *Bitcoin (1 Unit)*\n` +
                         ` ↳ Harga: RM ${marketState.btc.toLocaleString()}\n` +
                         ` ↳ Trend: ${marketState.trendBtc}\n\n` +
                         `💡 *Info:* Harga berubah setiap 5 minit.\n` +
                         `🛒 *Guna:* \`.beli_btc 1\` | \`.jual_emas 10\``;
                
                return sock.sendMessage(jid, { text: ui }, { quoted: m });
            }

            // --- SISTEM BELI ---
            if (cmd === 'beli_btc' || cmd === 'beli_emas') {
                const isBtc = cmd === 'beli_btc';
                const asetNama = isBtc ? 'BTC' : 'Emas';
                const hargaSemasa = isBtc ? marketState.btc : marketState.emas;
                
                const unit = parseFloat(args[0]);
                if (isNaN(unit) || unit <= 0) return sock.sendMessage(jid, { text: `❌ Sila letak kuantiti yang sah. Contoh: \`.${cmd} 2\`` }, { quoted: m });

                const totalHarga = Math.floor(unit * hargaSemasa);

                if ((user.wallet || 0) < totalHarga) {
                    return sock.sendMessage(jid, { text: `❌ Poket kau tak cukup! Modal diperlukan: *RM ${totalHarga.toLocaleString()}*` }, { quoted: m });
                }

                user.wallet -= totalHarga;
                if (isBtc) {
                    user.btc = (user.btc || 0) + unit;
                } else {
                    user.emas = (user.emas || 0) + unit;
                }
                
                await db.saveUser(user);
                return sock.sendMessage(jid, { text: `✅ Berjaya memborong *${unit} ${asetNama}* dengan harga RM ${totalHarga.toLocaleString()}! Bawa bersabar tunggu bullrun.` }, { quoted: m });
            }

            // --- SISTEM JUAL ---
            if (cmd === 'jual_btc' || cmd === 'jual_emas') {
                const isBtc = cmd === 'jual_btc';
                const asetNama = isBtc ? 'BTC' : 'Emas';
                const hargaSemasa = isBtc ? marketState.btc : marketState.emas;
                const bakiAset = isBtc ? (user.btc || 0) : (user.emas || 0);
                
                const unit = parseFloat(args[0]);
                if (isNaN(unit) || unit <= 0) return sock.sendMessage(jid, { text: `❌ Sila letak kuantiti yang sah. Contoh: \`.${cmd} 1\`` }, { quoted: m });

                if (bakiAset < unit) {
                    return sock.sendMessage(jid, { text: `❌ Aset tak cukup. Kau cuma ada *${bakiAset} ${asetNama}*.` }, { quoted: m });
                }

                const totalUntung = Math.floor(unit * hargaSemasa);

                if (isBtc) {
                    user.btc -= unit;
                } else {
                    user.emas -= unit;
                }
                user.wallet += totalUntung;
                
                await db.saveUser(user);
                return sock.sendMessage(jid, { text: `💸 Berjaya mencairkan *${unit} ${asetNama}*! Tunai masuk ke poket: RM ${totalUntung.toLocaleString()}.` }, { quoted: m });
            }

        } catch (err) {
            console.error("Pasaran Error:", err);
        }
    }
};
