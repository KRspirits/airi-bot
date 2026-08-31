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

            const teksBal = `
┌───「 💳 **PORTFOLIO KEWANGAN** 」
├ 👤 **Nama** : ${nama}
├ 💵 **Poket** : RM ${poket.toLocaleString()}
├ 🏦 **Bank** : RM ${bank.toLocaleString()}
├ 🏴‍☠️ **Duit Gelap**: RM ${duitGelap.toLocaleString()}
├ 🪙 **Emas** : ${emas.toLocaleString()} Gram
├ ₿ **BTC** : ${btc.toLocaleString()} Unit
├ 📊 **Jumlah** : RM ${jumlahTunai.toLocaleString()}
└───────────────────────────

💬 **Airi**: "Banyak simpan dalam bank tu tak takut kena hack ke bang? Belanja la aku sikit."`.trim();

            return sock.sendMessage(jid, { text: teksBal }, { quoted: m });
        } catch (err) {
            console.error("Balance Error:", err);
        }
    }
};
