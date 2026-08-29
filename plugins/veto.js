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
        
        // Ambil ID sebenar penghantar (dalam grup atau PM)
        const senderJid = m.key.participant || jid;
        
        // Buang semua simbol bukan nombor, port peranti (:1), dan akhiran WhatsApp
        const cleanSender = senderJid.replace(/@.*$/, '').replace(/:.*$/, '').replace(/[^0-9]/g, '');

        // Semak sama ada nombor pengirim sepadan dengan mana-mana nombor dalam senarai owner
        const isOwner = (config.ownerNumbers || []).some(ownerNum => {
            const cleanOwner = ownerNum.replace(/[^0-9]/g, '');
            return cleanSender.includes(cleanOwner) || cleanOwner.includes(cleanSender);
        });

        // Jika bukan Bos Amar, tolak akses
        if (!isOwner) {
            return sock.sendMessage(jid, { 
                text: `⛔ *AKSES DITOLAK!* Zon Kuasa Mutlak hanya untuk Bos Amar!\n\nID Anda dikesan: \`${cleanSender}\`` 
            }, { quoted: m });
        }

        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const args = teks.trim().split(' ').slice(1);
        const cmd = teks.slice(1).trim().split(' ')[0].toLowerCase();

        // 1. SET INCOME POKET
        if (cmd === 'set_income') {
            const amt = parseInt(args[0]);
            if (isNaN(amt) || amt < 0) return sock.sendMessage(jid, { text: '❌ Masukkan amaun tunai yang sah!' }, { quoted: m });
            user.wallet = amt;
            await db.saveUser(user);
            return sock.sendMessage(jid, { text: `👑 *DANA AMAR DITETAPKAN:* RM ${amt.toLocaleString()} tunai dalam poket!` }, { quoted: m });
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
                text: `👑 *SUNTIKAN ASET BERJAYA!*\nSasaran: @${targetJid.split('@')[0]}\nNilai: ${nilai.toLocaleString()} ${cmd.replace('give_', '').toUpperCase()}`,
                mentions: [targetJid]
            }, { quoted: m });
        }

        // 3. LOKAP PAKSA & BEBAS SERTA-MERTA
        if (cmd === 'jail_user') {
            const targetJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            const saat = parseInt(args[1]) || 120;
            if (!targetJid) return sock.sendMessage(jid, { text: '❌ Tag sasaran: `.jail_user @user [saat]`' }, { quoted: m });

            const targetUser = await db.getUser(targetJid);
            targetUser.jail.status = true;
            targetUser.jail.release_at = Date.now() + (saat * 1000);
            targetUser.jail.reason = "Titah Mutlak Bos Amar";
            await db.saveUser(targetUser);

            return sock.sendMessage(jid, { text: `🚨 @${targetJid.split('@')[0]} disumbat ke lokap (${saat} saat)!`, mentions: [targetJid] }, { quoted: m });
        }

        if (cmd === 'free_user') {
            const targetJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            if (!targetJid) return sock.sendMessage(jid, { text: '❌ Tag sasaran: `.free_user @user`' }, { quoted: m });

            const targetUser = await db.getUser(targetJid);
            targetUser.jail.status = false;
            targetUser.jail.release_at = 0;
            await db.saveUser(targetUser);

            return sock.sendMessage(jid, { text: `🕊️ @${targetJid.split('@')[0]} dibebaskan daripada lokap serta-merta!`, mentions: [targetJid] }, { quoted: m });
        }

        // 4. LELONGAN KONTENA MENGEJUT
        if (cmd === 'start_lelong') {
            const { triggerRandomAuction } = await import('./bida.js');
            await triggerRandomAuction(sock, jid);
            return;
        }

        // 5. EVENT GLOBAL & BLESSING
        if (cmd === 'list_event') {
            return sock.sendMessage(jid, {
                text: `📜 *SENARAI ACARA GLOBAL (VETO)*\n1. CRIME_BOOM (Hasil jenayah x2)\n2. GOLD_RUSH (Harga emas & ikan x3)\n3. TECH_SURGE (Diskaun BM 40%)\n4. *AMAR_BLESSING* (100x ganda SEMUA hasil pendapatan!)\n\nGuna: \`.start_event [KOD] [HARI]\``
            }, { quoted: m });
        }

        if (cmd === 'start_event') {
            const kod = args[0]?.toUpperCase();
            return sock.sendMessage(jid, { text: `👑 Acara Global *${kod || 'RAWAK'}* telah diaktifkan oleh Bos Amar!` }, { quoted: m });
        }

        if (cmd === 'stop_event') {
            return sock.sendMessage(jid, { text: `👑 Semua acara global telah ditutup serta-merta!` }, { quoted: m });
        }

        // 6. SERU WORLD BOSS
        if (cmd === 'spawn_boss') {
            return sock.sendMessage(jid, {
                text: `🚨 *AMARAN KRITIKAL! BOSS DUNIA DILEPASKAN!*\n👾 *AI Rogue Titan-X*\n🩸 HP: 500,000 HP\n💰 Ganjaran Kongsi: RM 1,000,000\n\nSemua pemain, taip *.serang_boss* sekarang!`
            });
        }

        // 7. DIAGNOSTIK KESIHATAN BOT
        if (cmd === 'autotest' || cmd === 'syscheck') {
            const mem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
            return sock.sendMessage(jid, {
                text: `⚙️ *LAPORAN DIAGNOSTIK AIRI OS*\n\n` +
                      `✅ Founder Status: Dikesan (${cleanSender})\n` +
                      `✅ Pangkalan Jentera: ${VEHICLES.length} Jentera\n` +
                      `✅ Pangkalan Hartanah: ${PROPERTIES.length} Geran\n` +
                      `✅ Pangkalan Hidupan Laut: ${FISH_DATABASE.length} Spesies\n` +
                      `✅ Sektor Pekerjaan: ${JOBS.length} Kerjaya\n` +
                      `🧠 Penggunaan RAM: ${mem} MB`
            }, { quoted: m });
        }
    }
};
