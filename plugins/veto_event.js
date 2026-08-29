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
    name: 'event_veto',
    alias: ['list_event', 'start_event', 'stop_event', 'musim'],
    execute: async ({ sock, m, user }) => {
        const jid = m.key.remoteJid;
        const senderJid = m.key.participant || jid;
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const args = teks.trim().split(' ').slice(1);
        const cmd = teks.slice(1).trim().split(' ')[0].toLowerCase();
        const isOwner = senderJid.replace(/[^0-9]/g, '') === config.owner.replace(/[^0-9]/g, '');

        // 1. LIHAT ACARA AKTIF (.musim)
        if (cmd === 'musim') {
            if (!activeGlobalEvent || Date.now() > activeGlobalEvent.expiresAt) {
                activeGlobalEvent = null;
                return sock.sendMessage(jid, { text: '🌐 *STATUS MUSIM:* Tiada sebarang acara global aktif buat masa ini.' }, { quoted: m });
            }

            const bakiJam = Math.ceil((activeGlobalEvent.expiresAt - Date.now()) / (1000 * 60 * 60));
            return sock.sendMessage(jid, {
                text: `┌───「 🌐 𝗦𝗧𝗔𝗧𝗨𝗦 𝗠𝗨𝗦𝗜𝗠 𝗔𝗞𝗧𝗜𝗙 」
├ 🔥 𝗔𝗰𝗮𝗿𝗮    : ${activeGlobalEvent.name}
├ 📜 𝗞𝗲𝘀𝗮𝗻    : ${activeGlobalEvent.desc}
├ ⏳ 𝗕𝗮𝗸𝗶 𝗠𝗮𝘀𝗮 : ${bakiJam} Jam Lagi
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "Gunakan peluang keemasan ni sebelum masa tamat!"`
            }, { quoted: m });
        }

        // 2. SENARAI 20 EVENT VETO (.list_event)
        if (cmd === 'list_event') {
            let str = `┌───「 📜 𝟮𝟬 𝗔𝗖𝗔𝗥𝗔 𝗩𝗘𝗧𝗢 𝗙𝗢𝗨𝗡𝗗𝗘𝗥 」\n├───────────────────────────\n`;
            let count = 1;
            for (const [code, ev] of Object.entries(VETO_EVENTS)) {
                str += `├ ${count++}. *${code}*\n│   └ ${ev.name}: _${ev.desc}_\n`;
            }
            str += `└───────────────────────────\nFormat Mula: \`.start_event [KOD] [BILANGAN_HARI]\`\nContoh: \`.start_event AMAR_BLESSING 2\``;
            return sock.sendMessage(jid, { text: str }, { quoted: m });
        }

        // 3. MULA EVENT BERSAMA MASA (Contoh: .start_event AMAR_BLESSING 2)
        if (cmd === 'start_event' && isOwner) {
            const kod = args[0]?.toUpperCase();
            const tempohHari = parseInt(args[1]) || 1; // Default 1 hari jika tak tulis

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
                text: `👑 *TITAH MUTLAK FOUNDER BOS AMAR!*\n\nAcara rasmi *${activeGlobalEvent.name}* kini diaktifkan untuk tempoh *${tempohHari} Hari*!\n\n📜 Kesan: _${activeGlobalEvent.desc}_\n⏳ Tamat Pada: ${new Date(activeGlobalEvent.expiresAt).toLocaleString('ms-MY')}`
            });
        }

        // 4. HENTIKAN EVENT SERTA-MERTA (.stop_event)
        if (cmd === 'stop_event' && isOwner) {
            activeGlobalEvent = null;
            return sock.sendMessage(jid, { text: '👑 Semua acara veto telah ditutup serta-merta oleh Founder.' }, { quoted: m });
        }
    }
};
