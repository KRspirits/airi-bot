export default {
    name: 'underworld_pack',
    alias: ['rompak', 'hackbank', 'santau', 'hutang_ahlong', 'bayar_ahlong'],
    execute: async ({ sock, m, user, db }) => {
        try {
            const jid = m.key.remoteJid;
            const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
            const cmd = teks.slice(1).trim().split(' ')[0].toLowerCase();
            const targetJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

            if (cmd === 'rompak' || cmd === 'hackbank') {
                if (!targetJid) return sock.sendMessage(jid, { text: `❌ Tag mangsa: \`.${cmd} @user\`` }, { quoted: m });
                const targetUser = await db.getUser(targetJid);
                
                const nasib = Math.random();
                if (nasib > 0.6) {
                    const hasil = Math.floor(Math.random() * 5000) + 1000;
                    user.dirty_money = (user.dirty_money || 0) + hasil;
                    if (cmd === 'rompak') targetUser.wallet = Math.max(0, (targetUser.wallet || 0) - hasil);
                    if (cmd === 'hackbank') targetUser.bank = Math.max(0, (targetUser.bank || 0) - hasil);
                    
                    await db.saveUser(user);
                    await db.saveUser(targetUser);
                    return sock.sendMessage(jid, { text: `🏴‍☠️ *BERJAYA!*\nKau berjaya sakau RM ${hasil.toLocaleString()} dari @${targetJid.split('@')[0]}!`, mentions: [targetJid] }, { quoted: m });
                } else {
                    user.jail = { status: true, release_at: Date.now() + 60000, reason: "Gagal " + cmd };
                    await db.saveUser(user);
                    return sock.sendMessage(jid, { text: `🚨 *KANTOI!*\nPolis dah serbu! Kau disumbat ke lokap selama 60 saat!` }, { quoted: m });
                }
            }

            if (cmd === 'santau') {
                if (!targetJid) return sock.sendMessage(jid, { text: `❌ Tag mangsa: \`.santau @user\`` }, { quoted: m });
                return sock.sendMessage(jid, { text: `💀 Angin bisa telah dihantar kepada @${targetJid.split('@')[0]}... Nyawa mereka berkurang!`, mentions: [targetJid] }, { quoted: m });
            }

            if (cmd === 'hutang_ahlong') {
                user.wallet = (user.wallet || 0) + 50000;
                user.hutang = (user.hutang || 0) + 60000; // Hutang berfaedah
                await db.saveUser(user);
                return sock.sendMessage(jid, { text: `🦈 *PINJAMAN AHLONG LULUS!*\n\nKau terima RM 50,000.\nHutang perlu dibayar: RM 60,000\nJangan lari kalau tak nak kena simbah cat!` }, { quoted: m });
            }

            if (cmd === 'bayar_ahlong') {
                const bayaran = 60000;
                if (!user.hutang || user.hutang <= 0) return sock.sendMessage(jid, { text: `✅ Kau takde hutang dengan ahlong.` }, { quoted: m });
                if (user.wallet < bayaran) return sock.sendMessage(jid, { text: `❌ Duit dalam poket tak cukup RM 60,000 untuk langsaikan ahlong!` }, { quoted: m });
                
                user.wallet -= bayaran;
                user.hutang = 0;
                await db.saveUser(user);
                return sock.sendMessage(jid, { text: `🦈 *HUTANG SELESAI*\n\nBuku kau dengan ahlong dah bersih.` }, { quoted: m });
            }

        } catch (err) {
            console.error("Underworld Error:", err);
        }
    }
};
