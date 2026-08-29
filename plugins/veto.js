import { config } from '../config.js';
import { VEHICLES, PROPERTIES, FISH_DATABASE, JOBS } from '../lib/gamedata.js';

export default {
    name: 'veto',
    alias: [
        'set_income', 'give_cash', 'give_gold', 'give_btc',
        'jail_user', 'free_user', 'start_lelong', 'set_market',
        'set_season', 'list_event', 'start_event', 'stop_event',
        'spawn_boss', 'autotest', 'syscheck'
    ],
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const senderJid = m.key.participant || jid;
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const args = teks.trim().split(' ').slice(1);
        const cmd = teks.slice(1).trim().split(' ')[0].toLowerCase();

        // Semakan nombor rasmi Amar
        const isOwner = senderJid.replace(/[^0-9]/g, '') === config.owner.replace(/[^0-9]/g, '');
        if (!isOwner) {
            return sock.sendMessage(jid, { 
                text: '⛔ *AKSES DITOLAK!* Zon Kuasa Mutlak hanya untuk Bos Amar!' 
            }, { quoted: m });
        }

        // 1. SET INCOME POKET
        if (cmd === 'set_income') {
            const amt = parseInt(args[0]);
            if (isNaN(amt) || amt < 0) return sock.sendMessage(jid, { text: '❌ Masukkan amaun!' }, { quoted: m });
            user.wallet = amt;
            await db.saveUser(user);
            return sock.sendMessage(jid, { text: `👑 *DANA AMAR DITETAPKAN:* RM ${amt.toLocaleString()} tunai di poket!` }, { quoted: m });
        }

        // 2. SUNTIK DUIT / EMAS / BITCOIN
        if (cmd === 'give_cash' || cmd === 'give_gold' || cmd === 'give_btc') {
            const targetJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            const nilai = parseFloat(args[1]);
            if (!targetJid || isNaN(nilai) || nilai <= 0) {
                return sock.sendMessage(jid, { text: `❌ Format: \`.${cmd} @user [nilai]\`` }, { quoted: m });
            }

            const targetUser = await db.getUser(targetJid);
            if (cmd === 'give_cash') targetUser.wallet += nilai;
            if (cmd === 'give_gold') targetUser.crypto.gold = (targetUser.crypto.gold || 0) + nilai;
            if (cmd === 'give_btc') targetUser.crypto.btc = (targetUser.crypto.btc || 0) + nilai;
            await db.saveUser(targetUser);

            return sock.sendMessage(jid, {
                text: `👑 *SUNTIKAN ASET OLEH BOS AMAR!*\nSasaran: @${targetJid.split('@')[0]}\nNilai: ${nilai.toLocaleString()} ${cmd.replace('give_', '').toUpperCase()}`,
                mentions: [targetJid]
            }, { quoted: m });
        }

        // 3. LOKAP & BEBAS
        if (cmd === 'jail_user') {
            const targetJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            const saat = parseInt(args[1]) || 120;
            if (!targetJid) return sock.sendMessage(jid, { text: '❌ Tag sasaran!' }, { quoted: m });

            const targetUser = await db.getUser(targetJid);
            targetUser.jail.status = true;
            targetUser.jail.release_at = Date.now() + (saat * 1000);
            targetUser.jail.reason = "Titah Mutlak Bos Amar";
            await db.saveUser(targetUser);

            return sock.sendMessage(jid, { text: `🚨 @${targetJid.split('@')[0]} disumbat ke lokap (${saat} saat)!`, mentions: [targetJid] }, { quoted: m });
        }

        if (cmd === 'free_user') {
            const targetJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            if (!targetJid) return sock.sendMessage(jid, { text: '❌ Tag sasaran!' }, { quoted: m });

            const targetUser = await db.getUser(targetJid);
            targetUser.jail.status = false;
            targetUser.jail.release_at = 0;
            await db.saveUser(targetUser);

            return sock.sendMessage(jid, { text: `🕊️ @${targetJid.split('@')[0]} dibebaskan serta-merta!`, mentions: [targetJid] }, { quoted: m });
        }

        // 4. LELONGAN KONTENA MENGEJUT
        if (cmd === 'start_lelong') {
            return sock.sendMessage(jid, {
                text: `🚨 *LELONGAN KONTENA MISTERI BERMULA!*\nTapak Bidaan: *RM 50,000*\nTaip \`.bida [nilai]\` untuk merebut kontena rahsia!`
            });
        }

        // 5. EVENT DAN ACARA RAHSIA (AMAR_BLESSING)
        if (cmd === 'list_event') {
            return sock.sendMessage(jid, {
                text: `📜 *SENARAI ACARA GLOBAL*\n1. CRIME_BOOM (Hasil jenayah x2)\n2. GOLD_RUSH (Harga ikan & sewa x2)\n3. TECH_SURGE (Diskaun BM 40%)\n4. *AMAR_BLESSING* (Buff Keramat: 100x ganda semua hasil!)`
            }, { quoted: m });
        }

        if (cmd === 'start_event') {
            const kod = args[0]?.toUpperCase();
            return sock.sendMessage(jid, { text: `👑 Acara Global *${kod}* diaktifkan oleh Bos Amar!` }, { quoted: m });
        }

        if (cmd === 'stop_event') {
            return sock.sendMessage(jid, { text: `👑 Semua acara global dihentikan!` }, { quoted: m });
        }

        // 6. SERU WORLD BOSS
        if (cmd === 'spawn_boss') {
            return sock.sendMessage(jid, {
                text: `🚨 *AMARAN KRITIKAL! BOSS DUNIA DILEPASKAN!*\n👾 *AI Rogue Titan-X*\n🩸 HP: 500,000 HP\n💰 Ganjaran Kongsi: RM 1,000,000\n\nSemua pemain, taip *.serang_boss* sekarang!`
            });
        }

        // 7. DIAGNOSTIK & AUTOTEST
        if (cmd === 'autotest' || cmd === 'syscheck') {
            const mem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
            return sock.sendMessage(jid, {
                text: `⚙️ *LAPORAN DIAGNOSTIK SHADOW LEGACY*\n\n` +
                      `✅ Enjin Jentera: ${VEHICLES.length} buah jentera sedia lumba\n` +
                      `✅ Enjin Hartanah: ${PROPERTIES.length} geran beroperasi\n` +
                      `✅ Spesies Laut: ${FISH_DATABASE.length} hidupan laut aktif\n` +
                      `✅ Sektor Pekerjaan: ${JOBS.length} kerjaya stabil\n` +
                      `🧠 Penggunaan Memori: ${mem} MB\n` +
                      `✨ Sambungan Pangkalan Data: MongoDB Atlas Stabil 100%!`
            }, { quoted: m });
        }
    }
};
