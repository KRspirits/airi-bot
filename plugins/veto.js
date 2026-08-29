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

        // 5. EVENT GLOBAL & 20 SENARAI EKSKLUSIF AMAR (DIKEMASKINI)
        if (cmd === 'veto' || cmd === 'list_event') {
            const targetEvent = args.join(' ').trim();
            
            const eventList = [
                "1. Kejohanan E-Sports Shadow Legion X Open 2026",
                "2. Pelancaran Rasmi Produk & Roadmap Shadow Legacy Co.",
                "3. Sesi Kalibrasi DPI Gaming Mouse & Macro Pro",
                "4. Pertandingan Memancing Extreme Fishing Planet Cup",
                "5. Kejohanan Ranking Global Mobile Legends: Bang Bang",
                "6. Kempen Eksklusif Genshin Impact Versi Shadow_Legacy",
                "7. Perlumbaan Musim Baharu Racing Master NetEase",
                "8. Sesi Live & Affiliate TikTok Shop Flash Sale",
                "9. Ujian Penilaian Rasmi E-Pengambilan PDRM",
                "10. Pelancaran Sistem Automasi WhatsApp Bot 'Shadow Nicole'",
                "11. Kemaskini E-Invoicing & Korporat Enterprise",
                "12. Sesi Reka Bentuk & Rendering Logo Peribadi Wolf",
                "13. Pertandingan Kelajuan Menaip Kod Node.js",
                "14. Ujian Sistem Sekuriti Steam Guard & kr_legacy",
                "15. Projek Grafik Digital Portal SIS Kitchen",
                "16. Sesi Pengurusan Kredit Media Harian Pippit",
                "17. Konvensyen Teknologi AI & Cloud Bersama SheerID",
                "18. Pertandingan Custom Wallpaper Desktop 2026",
                "19. Sesi Pemindahan Fail Smash & Arkib Data",
                "20. Sidang Kemuncak Khas Pemegang Saham Shadow Legacy"
            ];

            if (targetEvent) {
                return sock.sendMessage(jid, { 
                    text: `🛡️ *SISTEM VETO RASMI AMAR* 🛡️\n\nPerintah Veto berjaya diaktifkan untuk event: *"${targetEvent}"*!\n\n✨ Status: *VETO DITERIMA & DILULUSKAN* oleh Boss Besar Amar! 🚀` 
                }, { quoted: m });
            } else {
                return sock.sendMessage(jid, {
                    text: `📋 *SENARAI 20 EVENT EKSKLUSIF AMAR (VETO)* 📋\n───────────────────────────\n` + 
                          eventList.join('\n') + 
                          `\n───────────────────────────\n💡 *Tip:* Taip \`.veto [nama/nombor event]\` untuk mengenakan kuasa veto mutlak! ✨`
                }, { quoted: m });
            }
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
            }, { quoted: m });
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
