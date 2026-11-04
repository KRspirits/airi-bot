export default {
    name: 'hutang_ahlong',
    alias: ['ahlong', 'pinjam', 'bayar_ahlong'],
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const args = teks.trim().split(' ').slice(1);
        const commandUsed = teks.slice(1).trim().split(' ')[0].toLowerCase();
        const now = Date.now();

        // 1. BAYAR PINJAMAN (.bayar_ahlong)
        if (commandUsed === 'bayar_ahlong') {
            const bakiHutang = user.loan?.amount || 0;
            if (bakiHutang <= 0) {
                return sock.sendMessage(jid, { text: '✅ Awak takde rekod hutang dengan Ah Long pun!' }, { quoted: m });
            }

            let bayar = args[0] === 'all' ? bakiHutang : parseInt(args[0]);
            if (!bayar || isNaN(bayar) || bayar <= 0) {
                return sock.sendMessage(jid, { 
                    text: `❌ Masukkan amaun nak bayar! Hutang semasa: RM ${bakiHutang.toLocaleString()}\nContoh: \`.bayar_ahlong all\` atau \`.bayar_ahlong 2000\`` 
                }, { quoted: m });
            }

            if (user.wallet < bayar) {
                return sock.sendMessage(jid, { 
                    text: `❌ Duit poket awak tak cukup! Cuma ada RM ${user.wallet.toLocaleString()}` 
                }, { quoted: m });
            }

            if (bayar > bakiHutang) bayar = bakiHutang;

            user.wallet -= bayar;
            user.loan.amount -= bayar;

            if (user.loan.amount <= 0) {
                user.loan.amount = 0;
                user.loan.due_at = 0;
            }
            await db.saveUser(user);

            const responBayar = `
┌───「 📋 𝗣𝗘𝗠𝗕𝗔𝗬𝗔𝗥𝗔𝗡 𝗛𝗨𝗧𝗔𝗡𝗚: 𝗦𝗘𝗟𝗘𝗦𝗔𝗜 」
├ 💵 𝗕𝗮𝘆𝗮𝗿     : RM ${bayar.toLocaleString()}
├ 💳 𝗕𝗮𝗸𝗶 𝗛𝘂𝘁𝗮𝗻𝗴: RM ${(user.loan.amount).toLocaleString()}
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "Bagus, pandai pinjam pandai bayar! Selamat pintu rumah awak daripada cat merah harini."`;

            return sock.sendMessage(jid, { text: responBayar }, { quoted: m });
        }

        // 2. BUAT PINJAMAN (.hutang_ahlong [amaun])
        if (user.loan?.amount > 0) {
            return sock.sendMessage(jid, { 
                text: `❌ Hutang lama RM ${user.loan.amount.toLocaleString()} belum settle, ada hati nak pinjam lagi! Guna \`.bayar_ahlong\` dulu.` 
            }, { quoted: m });
        }

        let amaunPinjam = parseInt(args[0]);
        const HAD_MAKSIMUM = 50000;

        if (!amaunPinjam || isNaN(amaunPinjam) || amaunPinjam <= 0) {
            return sock.sendMessage(jid, { 
                text: `┌───「 🦈 𝗣𝗜𝗡𝗝𝗔𝗠𝗔𝗡 𝗦𝗘𝗚𝗘𝗥𝗔 𝗔𝗛 𝗟𝗢𝗡𝗚 」
│ _Faedah 30% | Tempoh bayaran 1 jam_
├ Masukkan amaun: \`.hutang_ahlong [jumlah]\`
├ Had Maksimum : RM ${HAD_MAKSIMUM.toLocaleString()}
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "Jangan buat pasal bro, bunga Ah Long ni kalah ceti haram!"` 
            }, { quoted: m });
        }

        if (amaunPinjam > HAD_MAKSIMUM) {
            return sock.sendMessage(jid, { 
                text: `❌ Ah Long tak bagi pinjam lebih dari had maksimum RM ${HAD_MAKSIMUM.toLocaleString()}!` 
            }, { quoted: m });
        }

        // Pengiraan Faedah 30%
        const faedah = Math.floor(amaunPinjam * 0.30);
        const totalKenaBayar = amaunPinjam + faedah;

        user.wallet += amaunPinjam;
        user.loan.amount = totalKenaBayar;
        user.loan.due_at = now + (60 * 60 * 1000); // 1 jam dari sekarang
        await db.saveUser(user);

        const responPinjam = `
┌───「 🦈 𝗣𝗜𝗡𝗝𝗔𝗠𝗔𝗡 𝗗𝗜𝗟𝗨𝗟𝗨𝗦𝗞𝗔𝗡 」
├ 💵 𝗧𝘂𝗻𝗮𝗶 𝗗𝗶𝘁𝗲𝗿𝗶𝗺𝗮 : +RM ${amaunPinjam.toLocaleString()}
├ 📈 𝗙𝗮𝗲𝗱𝗮𝗵 (𝟯𝟬%)  : RM ${faedah.toLocaleString()}
├ 🧾 𝗧𝗼𝘁𝗮𝗹 𝗛𝘂𝘁𝗮𝗻𝗴  : RM ${totalKenaBayar.toLocaleString()}
├ ⏳ 𝗧𝗲𝗺𝗽𝗼𝗵 𝗕𝗮𝘆𝗮𝗿 : 1 Jam
└───────────────────────────
Guna \`.bayar_ahlong [jumlah]\` sebelum rumah kena simbah cat!
💬 𝗔𝗶𝗿𝗶: "Duit masuk poket senyum lebar, masa nak bayar balik jangan pura-pura lupa pulak."`;

        return sock.sendMessage(jid, { text: responPinjam }, { quoted: m });
    }
};
