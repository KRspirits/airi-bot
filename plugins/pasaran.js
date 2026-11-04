import * as store from '../lib/store.js';
import { renderCandles } from '../lib/chart.js';

// Memori pasaran: harga bergerak perlahan (random walk) setiap 5 minit, dan sejarah disimpan.
const marketState = { btc: 250000, emas: 350, trendBtc: '📈', trendEmas: '📈', lastUpdate: 0, candles: { btc: [], emas: [] }, loaded: false };
const klamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 2;

// Berita kecil (hanya untuk satu kemas kini harga seterusnya). Had ±5%.
const berita = { btc: 0, emas: 0 };
export function beritaPasaran(aset, peratus) {
    if (!(aset in berita)) return;
    berita[aset] = Math.max(-0.05, Math.min(0.05, peratus));
}

async function loadMarket() {
    if (marketState.loaded) return;
    const s = await store.get('market', 'state', null);
    if (s && typeof s === 'object') Object.assign(marketState, s);
    marketState.loaded = true;
}

function pushCandle(k, o, c) {
    const hi = Math.max(o, c) * (1 + Math.random() * 0.01);
    const lo = Math.min(o, c) * (1 - Math.random() * 0.01);
    const arr = marketState.candles[k];
    arr.push({ o, h: Math.round(hi), l: Math.round(lo), c });
    if (arr.length > 40) arr.shift();
}

const SLOT_MS = 5 * 60 * 1000;
const ASAS = { btc: 250000, emas: 350 };

// Harga bergerak setiap slot 5 minit, walaupun tiada siapa guna pasaran.
// Kalau bot terlepas beberapa slot, setiap slot diisi satu-satu (tiada jurang carta).
async function updateMarket() {
    await loadMarket();
    const kini = Date.now();
    if (!marketState.lastUpdate) marketState.lastUpdate = kini - (kini % SLOT_MS);
    let langkah = 0;
    while (kini - marketState.lastUpdate >= SLOT_MS && langkah < 48) {
        const oldBtc = marketState.btc, oldEmas = marketState.emas;
        const tarikBtc = (ASAS.btc - oldBtc) / ASAS.btc * 0.02;
        const tarikEmas = (ASAS.emas - oldEmas) / ASAS.emas * 0.02;
        marketState.btc = klamp(Math.round(oldBtc * (1 + gauss() * 0.006 + tarikBtc + berita.btc)), 150000, 400000);
        marketState.emas = klamp(Math.round(oldEmas * (1 + gauss() * 0.002 + tarikEmas + berita.emas)), 300, 450);
        berita.btc = 0; berita.emas = 0;
        marketState.trendBtc = marketState.btc >= oldBtc ? '📈 Naik' : '📉 Turun';
        marketState.trendEmas = marketState.emas >= oldEmas ? '📈 Naik' : '📉 Turun';
        marketState.lastUpdate += SLOT_MS;
        pushCandle('btc', oldBtc, marketState.btc);
        pushCandle('emas', oldEmas, marketState.emas);
        langkah++;
    }
    if (langkah > 0) {
        await store.set('market', 'state', { btc: marketState.btc, emas: marketState.emas, trendBtc: marketState.trendBtc, trendEmas: marketState.trendEmas, lastUpdate: marketState.lastUpdate, candles: marketState.candles });
    }
}

// Sejarah awal bila belum cukup candle: laluan rawak yang berakhir di harga semasa (bukan data sebenar).
function isiSejarahAwal(aset) {
    const arr = marketState.candles[aset];
    if (arr.length >= 12) return;
    let harga = aset === 'btc' ? marketState.btc : marketState.emas;
    const baru = [];
    for (let i = 0; i < 24; i++) {
        const sebelum = Math.max(1, Math.round(harga / (1 + gauss() * (aset === 'btc' ? 0.006 : 0.002))));
        baru.unshift({ o: sebelum, h: Math.round(Math.max(sebelum, harga) * 1.002), l: Math.round(Math.min(sebelum, harga) * 0.998), c: harga });
        harga = sebelum;
    }
    marketState.candles[aset] = [...baru, ...arr].slice(-40);
}

/** Dipanggil oleh scheduler setiap minit. Hanya bertindak bila slot 5 minit baharu dah lepas. */
export async function tickMarket() { return updateMarket(); }

export default {
    name: 'pasaran',
    alias: ['beli_btc', 'jual_btc', 'beli_emas', 'jual_emas'],
    execute: async ({ sock, m, user, db }) => {
        try {
            const jid = m.key.remoteJid;
            const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
            const args = teks.trim().split(' ').slice(1);
            const cmd = teks.slice(1).trim().split(' ')[0].toLowerCase();

            await updateMarket(); // kemas kini harga & sejarah

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
                
                const aset = (args[0] || '').toLowerCase() === 'emas' ? 'emas' : 'btc';
                isiSejarahAwal(aset);
                let lilin = marketState.candles[aset];
                const harga = aset === 'btc' ? marketState.btc : marketState.emas;
                if (lilin.length < 2) lilin = [{ o: harga, h: harga, l: harga, c: harga }, { o: harga, h: harga, l: harga, c: harga }];
                try {
                    const img = renderCandles(lilin, { title: "PASARAN AIRI'S CORNER", subtitle: aset === 'btc' ? 'Bitcoin · candle 5 minit' : 'Emas · candle 5 minit', harga });
                    return sock.sendMessage(jid, { image: img, caption: ui }, { quoted: m });
                } catch (e) {
                    console.error('[CARTA]', e.message);
                    return sock.sendMessage(jid, { text: ui }, { quoted: m });
                }
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
                    return sock.sendMessage(jid, { text: `❌ Poket awak tak cukup! Modal diperlukan: *RM ${totalHarga.toLocaleString()}*` }, { quoted: m });
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
                    return sock.sendMessage(jid, { text: `❌ Aset tak cukup. Awak cuma ada *${bakiAset} ${asetNama}*.` }, { quoted: m });
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
