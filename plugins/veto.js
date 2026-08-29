import { config } from '../config.js';

export const VETO_EVENTS = {
    AMAR_BLESSING: { name: "👑 Berkat Bos Amar", mult: 100.0, desc: "100x ganda SEMUA hasil pendapatan!" },
    GOLD_RUSH: { name: "💰 Gelombang Emas", mult: 3.0, desc: "Harga jualan emas & ikan naik 3x ganda!" },
    CRYPTO_MOON: { name: "🚀 Ledakan Bullrun BTC", mult: 2.5, desc: "Keuntungan trading kripto naik 2.5x!" },
    MEGA_HARVEST: { name: "🌊 Badai Laut Dalam", mult: 3.0, desc: "Jeti pancing dijamin tangkapan Rare & Mythic!" },
    CYBER_REBATE: { name: "🏷️ Rebat Tunai Madani", mult: 1.5, desc: "Cashback 50% untuk pembelian showroom & gear!" },
    BLACK_MARKET_CARNIVAL: { name: "🎪 Karnival Pasar Gelap", mult: 2.0, desc: "BM buka 24 jam & diskaun barang panas 50%!" },
    TAX_HOLIDAY: { name: "💸 Hari Bebas Cukai", mult: 1.0, desc: "0% caj fee untuk transfer & cuci duit haram!" },
    SPEED_DEMON: { name: "🏁 Pelesit Malam Karak", mult: 4.0, desc: "Ganjaran lumba drag haram digandakan 4x!" },
    OVERTIME_FRENZY: { name: "⚡ Kerja Lebih Masa", mult: 2.0, desc: "Gaji kerja halal naik 2x & cooldown cuma 10 saat!" },
    TREASURE_SURGE: { name: "🧲 Arus Khazanah Sungai", mult: 2.5, desc: "80% peluang magnet dapat Peti Besi Misteri!" },
    CASINO_FIESTA: { name: "🎰 Pesta Jackpot Kasino", mult: 3.0, desc: "Peluang menang slot 777 melonjak ke 70%!" },
    LANDLORD_BOOM: { name: "🏢 Dividen Hartanah Mega", mult: 3.0, desc: "Kutipan sewa rumah & premis naik 3x ganda!" },
    ZERO_JAIL_DAY: { name: "🕊️ Hari Pengampunan", mult: 1.0, desc: "Polis bercuti; tiada hukuman lokap hari ini!" },
    SUBSIDI_MINYAK: { name: "🚛 Subsidi Seludup", mult: 2.0, desc: "Modal seludup percuma, untung bersih maksima!" },
    ROYAL_AIRDROP: { name: "🎁 Royal Airdrop Amar", mult: 1.0, desc: "Sistem tabur RM 10,000 tunai setiap 10 minit!" },
    BOUNTY_HUNTER_RUSH: { name: "🎯 Pesta Pemburu Kepala", mult: 1.5, desc: "Klaim wang tebusan buronan dapat bonus +50%!" },
    HACKER_PARADISE: { name: "💻 Kelemahan Induk Bank", mult: 2.0, desc: "Peluang hackbank naik 90% kebal serbuan!" },
    EGG_HATCH_SPEED: { name: "🐣 Inkubator Kilat", mult: 1.0, desc: "Telur pet menetas SERTA-MERTA tanpa tunggu!" },
    AHLONG_DISCOUNT: { name: "🦈 Pelupusan Faedah", mult: 1.0, desc: "Hutang ahlong dihapuskan bunga, bayar pokok sahaja!" },
    GOD_OF_FORTUNE: { name: "🌟 Restu Dewa Rezeki", mult: 5.0, desc: "95% peluang menang nasib rawak dalam grup!" }
};

export let activeGlobalEvent = null;

export default {
    name: 'veto_amar',
    alias: [
        'veto', 'list_event', 'start_event', 'stop_event', 'musim',
        'set_income', 'give_cash', 'give_gold', 'give_btc',
        'jail_user', 'free_user', 'syscheck'
    ],
    execute: async ({ sock, m, user, db }) => {
        try {
            const jid = m.key.remoteJid;
            const senderJid = m.key.participant || jid;
            const cleanSender = String(senderJid).replace(/[^0-9]/g, '');
            
            const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
            const args = teks.trim().split(' ').slice(1);
            const cmd = teks.slice(1).trim().split(' ')[0].toLowerCase();

            // 1. FUNGSI MUSIM (BOLEH DIBACA OLEH SEMUA ORANG)
            if (cmd === 'musim') {
                if (!activeGlobalEvent || Date.now() > activeGlobalEvent.expiresAt) {
                    activeGlobalEvent = null;
                    return sock.sendMessage(jid, { text: '🌐 *STATUS MUSIM:* Tiada sebarang acara global aktif buat masa ini.' }, { quoted: m });
                }
                const bakiJam = Math.ceil((activeGlobalEvent.expiresAt - Date.now()) / (1000 * 60 * 60));
                return sock.sendMessage(jid, {
                    text: `┌───「 🌐 𝗦𝗧𝗔𝗧𝗨𝗦 𝗠𝗨𝗦𝗜𝗠 𝗔𝗞𝗧𝗜𝗙 」\n├ 🔥 𝗔𝗰𝗮𝗿𝗮 : ${activeGlobalEvent.name}\n├ 📜 𝗞𝗲𝘀𝗮𝗻 : ${activeGlobalEvent.desc}\n├ ⏳ 𝗕𝗮𝗸𝗶 𝗠𝗮𝘀𝗮 : ${bakiJam} Jam Lagi\n└───────────────────────────`
                }, { quoted: m });
            }

            // KAWALAN KESELAMATAN: VERIFIKASI PENGASAS
            const ownersList = Array.isArray(config.ownerNumbers) ? config.ownerNumbers : (config.owner ? [config.owner] : []);
            const isOwner = ownersList.some(ownerNum => {
                const cleanOwner = String(ownerNum).replace(/[^0-9]/g, '');
                return cleanSender.includes(cleanOwner) || cleanOwner.includes(cleanSender);
            });

            // HALANG JIKA BUKAN AMAR YANG GUNA ARAHAN DI BAWAH
            if (!isOwner) {
                if (cmd === 'veto') {
                    return sock.sendMessage(jid, { text: '⛔ *AKSES DITOLAK!* Menu Veto hanya untuk Bos Amar!' }, { quoted: m });
                }
                return; // Senyap jika command lain ditekan oleh orang awam
            }

            // 2. MENU KHAS VETO (HANYA UNTUK AMAR)
            if (cmd === 'veto') {
                const menuKhas = `
🛡️ *PANGKALAN VETO BOS AMAR* 🛡️

1️⃣ *.list_event* - Papar 20 Acara Mutlak
2️⃣ *.start_event [KOD] [HARI]* - Mula Acara
3️⃣ *.stop_event* - Hentikan Acara Aktif
4️⃣ *.set_income [nilai]* - Set duit poket sendiri
5️⃣ *.give_cash @user [nilai]* - Suntik dana
6️⃣ *.jail_user @user [saat]* - Sumbat ke lokap
7️⃣ *.free_user @user* - Bebaskan pemain
8️⃣ *.syscheck* - Semak status RAM bot
`;
                return sock.sendMessage(jid, { text: menuKhas.trim() }, { quoted: m });
            }

            // 3. SENARAI EVENT VETO
            if (cmd === 'list_event') {
                let str = `┌───「 📜 𝟮𝟬 𝗔𝗖𝗔𝗥𝗔 𝗩𝗘𝗧𝗢 𝗙𝗢𝗨𝗡𝗗𝗘𝗥 」\n├───────────────────────────\n`;
                let count = 1;
                for (const [code, ev] of Object.entries(VETO_EVENTS)) {
                    str += `├ ${count++}. *${code}*\n│   └ ${ev.name}: _${ev.desc}_\n`;
                }
                str += `└───────────────────────────\nContoh: \`.start_event AMAR_BLESSING 2\``;
                return sock.sendMessage(jid, { text: str }, { quoted: m });
            }

            // 4. MULA EVENT
            if (cmd === 'start_event') {
                const kod = args[0]?.toUpperCase();
                const tempohHari = parseInt(args[1]) || 1; 

                if (!VETO_EVENTS[kod]) {
                    return sock.sendMessage(jid, { text: '❌ Kod event tidak sah! Taip `.list_event` untuk senarai.' }, { quoted: m });
                }
                const durationMs = tempohHari * 24 * 60 * 60 * 1000;
                activeGlobalEvent = {
                    ...VETO_EVENTS[kod],
                    code: kod,
                    expiresAt: Date.now() + durationMs,
                    days: tempohHari
                };
                return sock.sendMessage(jid, {
                    text: `👑 *TITAH MUTLAK FOUNDER BOS AMAR!*\n\nAcara rasmi *${activeGlobalEvent.name}* kini diaktifkan untuk tempoh *${tempohHari} Hari*!\n📜 Kesan: _${activeGlobalEvent.desc}_`
                });
            }

            // 5. HENTIKAN EVENT
            if (cmd === 'stop_event') {
                activeGlobalEvent = null;
                return sock.sendMessage(jid, { text: '👑 Semua acara veto telah ditutup serta-merta.' }, { quoted: m });
            }

            // 6. KAWALAN KEWANGAN & LOKAP
            if (cmd === 'set_income') {
                const amt = parseInt(args[0]);
                if (isNaN(amt) || amt < 0) return sock.sendMessage(jid, { text: '❌ Amaun tidak sah!' }, { quoted: m });
                user.wallet = amt;
                if (db) await db.saveUser(user);
                return sock.sendMessage(jid, { text: `👑 Dana tunai ditetapkan kepada RM ${amt.toLocaleString()}!` }, { quoted: m });
            }

            if (cmd === 'give_cash') {
                const targetJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
                const nilai = parseFloat(args[1]);
                if (!targetJid || isNaN(nilai)) return sock.sendMessage(jid, { text: `❌ Format: \`.give_cash @user [nilai]\`` }, { quoted: m });
                
                if (db) {
                    const targetUser = await db.getUser(targetJid);
                    targetUser.wallet = (targetUser.wallet || 0) + nilai;
                    await db.saveUser(targetUser);
                }
                return sock.sendMessage(jid, { text: `👑 Suntikan RM ${nilai.toLocaleString()} berjaya ke atas @${targetJid.split('@')[0]}`, mentions: [targetJid] }, { quoted: m });
            }

            if (cmd === 'jail_user') {
                const targetJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
                const saat = parseInt(args[1]) || 120;
                if (!targetJid) return sock.sendMessage(jid, { text: '❌ Tag sasaran: `.jail_user @user [saat]`' }, { quoted: m });
                
                if (db) {
                    const targetUser = await db.getUser(targetJid);
                    targetUser.jail = { status: true, release_at: Date.now() + (saat * 1000), reason: "Titah Mutlak Bos Amar" };
                    await db.saveUser(targetUser);
                }
                return sock.sendMessage(jid, { text: `🚨 @${targetJid.split('@')[0]} disumbat ke lokap (${saat} saat)!`, mentions: [targetJid] }, { quoted: m });
            }

            if (cmd === 'syscheck') {
                const mem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
                return sock.sendMessage(jid, { text: `⚙️ *LAPORAN DIAGNOSTIK*\n\n✅ Penggunaan RAM: ${mem} MB\n✅ Sistem berjalan lancar.` }, { quoted: m });
            }

        } catch (err) {
            console.error("Owner Veto Error:", err);
        }
    }
};
