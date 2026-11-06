import { sceneCard } from '../lib/scene.js';
export default {
    name: 'underworld_pack',
    alias: ['rompak', 'rob', 'hackbank', 'santau', 'hutang_ahlong', 'bayar_ahlong'],
    execute: async ({ sock, m, user, db }) => {
        try {
            const jid = m.key.remoteJid;
            const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
            const cmd = teks.slice(1).trim().split(' ')[0].toLowerCase();
            const targetJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

            if (cmd === 'rompak' || cmd === 'rob' || cmd === 'hackbank') {
                if (!targetJid) return sock.sendMessage(jid, { text: `❌ Tag mangsa: \`.${cmd} @user\`` }, { quoted: m });
                if (targetJid === m.key.participant || targetJid === jid) return sock.sendMessage(jid, { text: '😅 Tak boleh rompak diri sendiri.' }, { quoted: m });
                const targetUser = await db.getUser(targetJid);
                targetUser.stats = targetUser.stats || {};
                const lindungi = (targetUser.stats.dirompak_last || 0) + 10 * 60e3 - Date.now();
                if (lindungi > 0) return sock.sendMessage(jid, { text: `🛡️ Mangsa tu baru je dirompak. Tunggu ${Math.ceil(lindungi / 60e3)} minit lagi.` }, { quoted: m });
                if ((targetUser.wallet || 0) < 1000) return sock.sendMessage(jid, { text: '💸 Mangsa tak ada cukup tunai untuk dirompak.' }, { quoted: m });
                const nasib = Math.random();
                if (nasib > 0.6) {
                    const hasil = Math.min(Math.floor(Math.random() * 5000) + 1000, Math.floor((targetUser.wallet || 0) * 0.5));
                    user.wallet = (user.wallet || 0) + hasil;
                    targetUser.stats.dirompak_last = Date.now();
                    if (cmd === 'rompak' || cmd === 'rob') targetUser.wallet = Math.max(0, (targetUser.wallet || 0) - hasil);
                    if (cmd === 'hackbank') targetUser.bank = Math.max(0, (targetUser.bank || 0) - hasil);
                    
                    await db.saveUser(user);
                    await db.saveUser(targetUser);
                    return sock.sendMessage(jid, { image: sceneCard('rompak'), caption: `🏴‍☠️ *BERJAYA!*\nKau berjaya sakau RM ${hasil.toLocaleString()} dari @${targetJid.split('@')[0]}!`, mentions: [targetJid] }, { quoted: m });
                } else {
                    user.jail = { status: true, release_at: Date.now() + 60000, reason: "Gagal " + cmd };
                    await db.saveUser(user);
                    return sock.sendMessage(jid, { image: sceneCard('tangkap'), caption: `🚨 *KANTOI!*\nPolis dah serbu! Awak disumbat ke lokap selama 60 saat!` }, { quoted: m });
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
                if (!user.hutang || user.hutang <= 0) return sock.sendMessage(jid, { text: `✅ Awak takde hutang dengan ahlong.` }, { quoted: m });
                if (user.wallet < bayaran) return sock.sendMessage(jid, { text: `❌ Duit dalam poket tak cukup RM 60,000 untuk langsaikan ahlong!` }, { quoted: m });
                
                user.wallet -= bayaran;
                user.hutang = 0;
                await db.saveUser(user);
                return sock.sendMessage(jid, { text: `🦈 *HUTANG SELESAI*\n\nBuku awak dengan ahlong dah bersih.` }, { quoted: m });
            }

        } catch (err) {
            console.error("Underworld Error:", err);
        }
    }
};
