import { config } from '../config.js';

export default {
    name: 'founder',
    alias: [], // dikendalikan oleh plugins/veto.js
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const senderJid = m.key.participant || jid;
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const args = teks.trim().split(' ').slice(1);
        const commandUsed = teks.slice(1).trim().split(' ')[0].toLowerCase();

        // Semak sama ada penghantar adalah Founder/Owner
        const isOwner = senderJid.replace(/[^0-9]/g, '') === config.owner.replace(/[^0-9]/g, '');

        if (!isOwner) {
            return sock.sendMessage(jid, { 
                text: '⛔ *AKSES DITOLAK!* Awak bukan Founder bot ni. Jangan gatal tangan nak sentuh kuasa veto!' 
            }, { quoted: m });
        }

        // 1. SET DUIT POKET SENDIRI (.set_income [jumlah])
        if (commandUsed === 'set_income') {
            const jumlah = parseInt(args[0]);
            if (isNaN(jumlah) || jumlah < 0) {
                return sock.sendMessage(jid, { text: '❌ Masukkan amaun angka yang sah! Contoh: `.set_income 1000000`' }, { quoted: m });
            }

            user.wallet = jumlah;
            await db.saveUser(user);

            return sock.sendMessage(jid, {
                text: `👑 *KUASA VETO FOUNDER*\nTunai poket awak telah ditetapkan kepada: *RM ${jumlah.toLocaleString()}*`
            }, { quoted: m });
        }

        // 2. SUMBAT PEMAIN KE LOKAP (.jail_user @user [minit])
        if (commandUsed === 'jail_user') {
            const targetJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            const minit = parseInt(args[1]) || 10;

            if (!targetJid) {
                return sock.sendMessage(jid, { text: '❌ Tag sasaran! Contoh: `.jail_user @user 15`' }, { quoted: m });
            }

            const targetUser = await db.getUser(targetJid);
            targetUser.jail.status = true;
            targetUser.jail.release_at = Date.now() + (minit * 60 * 1000);
            targetUser.jail.reason = "Perintah Veto Founder";
            await db.saveUser(targetUser);

            return sock.sendMessage(jid, {
                text: `⚖️ *HUKUMAN DIJALANKAN*\n@${targetJid.split('@')[0]} disumbat ke lokap selama *${minit} minit* atas titah Founder!`,
                mentions: [targetJid]
            }, { quoted: m });
        }

        // 3. BEBASKAN PEMAIN DARI LOKAP (.free_user @user)
        if (commandUsed === 'free_user') {
            const targetJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            if (!targetJid) {
                return sock.sendMessage(jid, { text: '❌ Tag sasaran! Contoh: `.free_user @user`' }, { quoted: m });
            }

            const targetUser = await db.getUser(targetJid);
            targetUser.jail.status = false;
            targetUser.jail.release_at = 0;
            await db.saveUser(targetUser);

            return sock.sendMessage(jid, {
                text: `🕊️ *PENGAMPUNAN FOUNDER*\n@${targetJid.split('@')[0]} telah dibebaskan serta-merta dari lokap!`,
                mentions: [targetJid]
            }, { quoted: m });
        }

        // 5. SEMAK MEMORI & STATUS SISTEM (.syscheck)
        if (commandUsed === 'syscheck') {
            const memUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
            return sock.sendMessage(jid, {
                text: `⚙️ *DIAGNOSTIK PELAYAN AIRI*\n├ Status: Online 24/7\n├ Penggunaan RAM: ${memUsed} MB\n└ Pangkalan Data: MongoDB Atlas Bersambung`
            }, { quoted: m });
        }
    }
};
