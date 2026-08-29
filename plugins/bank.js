export default {
    name: 'dep',
    alias: ['deposit', 'wd', 'withdraw'],
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const args = teks.trim().split(' ').slice(1);
        const commandUsed = teks.slice(1).trim().split(' ')[0].toLowerCase();

        // 1. DEPOSIT (Simpan duit poket ke bank)
        if (commandUsed === 'dep' || commandUsed === 'deposit') {
            if (user.wallet <= 0) {
                return sock.sendMessage(jid, { text: '❌ Poket kau kosong, nak simpan apa?' }, { quoted: m });
            }

            let amount = args[0] === 'all' ? user.wallet : parseInt(args[0]);
            if (!amount || isNaN(amount) || amount <= 0) {
                return sock.sendMessage(jid, { text: '❌ Masukkan jumlah! Contoh: `.dep 500` atau `.dep all`' }, { quoted: m });
            }

            if (amount > user.wallet) {
                return sock.sendMessage(jid, { text: '❌ Duit dalam poket kau tak cukup banyak tu!' }, { quoted: m });
            }

            user.wallet -= amount;
            user.bank += amount;
            await db.saveUser(user);

            return sock.sendMessage(jid, {
                text: `🏦 *Deposit Berjaya!* RM ${amount.toLocaleString()} telah dipindahkan ke akaun bank.\nBaki Bank: RM ${user.bank.toLocaleString()}`
            }, { quoted: m });
        }

        // 2. WITHDRAW (Tarik duit bank ke poket)
        if (commandUsed === 'wd' || commandUsed === 'withdraw') {
            if (user.bank <= 0) {
                return sock.sendMessage(jid, { text: '❌ Akaun bank kau kosong!' }, { quoted: m });
            }

            let amount = args[0] === 'all' ? user.bank : parseInt(args[0]);
            if (!amount || isNaN(amount) || amount <= 0) {
                return sock.sendMessage(jid, { text: '❌ Masukkan jumlah! Contoh: `.wd 500` atau `.wd all`' }, { quoted: m });
            }

            if (amount > user.bank) {
                return sock.sendMessage(jid, { text: '❌ Duit simpanan bank kau tak mencukupi!' }, { quoted: m });
            }

            user.bank -= amount;
            user.wallet += amount;
            await db.saveUser(user);

            return sock.sendMessage(jid, {
                text: `💵 *Keluaran Tunai Berjaya!* RM ${amount.toLocaleString()} masuk ke poket.\nBaki Bank: RM ${user.bank.toLocaleString()}`
            }, { quoted: m });
        }
    }
};
