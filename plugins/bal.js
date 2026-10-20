import { renderBankCard, bankTier } from '../lib/idcards.js';

export default {
    name: 'balance',
    alias: ['bal', 'duit', 'akaun', 'wallet'],
    execute: async ({ sock, m, user }) => {
        try {
            const jid = m.key.remoteJid;
            const nama = m.pushName || user.name || 'Warga Siber';

            // Tarik data tunai & aset
            const poket = user.wallet || 0;
            const bank = user.bank || 0;
            const duitGelap = user.duit_gelap || 0;
            const emas = user.emas || user.inventory?.emas || 0;
            const btc = user.btc || user.inventory?.btc || 0;
            
            const jumlahTunai = poket + bank + duitGelap;

            const teksBal = `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
   💳  AIRI'S CORNER  ·  PORTFOLIO
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
👤  ${nama}
💵  Poket     RM ${poket.toLocaleString()}
🏦  Bank      RM ${bank.toLocaleString()}
🏴‍☠️  Duit Gelap  RM ${duitGelap.toLocaleString()}
🪙  Emas      ${emas.toLocaleString()} gram
₿  BTC       ${btc.toLocaleString()} unit
📊  Jumlah    RM ${jumlahTunai.toLocaleString()}

💬 Airi: "Banyak simpan kat bank, tak risau kena hack ke? Belanja aku la sikit."`.trim();

            try {
                const tier = bankTier(bank);
                const img = renderBankCard(user, nama);
                return sock.sendMessage(jid, { image: img, caption: `💳 Kad ${tier.label} kau\n` + teksBal }, { quoted: m });
            } catch (e) {
                console.error('[KAD BANK]', e.message);
            }
            return sock.sendMessage(jid, { text: teksBal }, { quoted: m });
        } catch (err) {
            console.error("Balance Error:", err);
        }
    }
};
