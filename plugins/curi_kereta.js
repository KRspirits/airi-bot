import { VEHICLES } from '../lib/gamedata.js';

const cdCuri = new Map();

export default {
    name: 'curi_kereta',
    alias: ['ketuk_chassis'],
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const senderId = m.key.participant || jid;
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const cmd = teks.slice(1).trim().split(' ')[0].toLowerCase();
        const now = Date.now();

        // 1. KETUK NOMBOR CHASSIS (.ketuk_chassis)
        if (cmd === 'ketuk_chassis') {
            if (!user.vehicle || !user.vehicle.is_stolen) {
                return sock.sendMessage(jid, { text: '❌ Jentera semasa kau bukan jentera curi/panas!' }, { quoted: m });
            }

            const upahPomen = 4500;
            if (user.wallet < upahPomen) {
                return sock.sendMessage(jid, { text: `❌ Upah pomen bawah pokok ketuk no chassis RM ${upahPomen.toLocaleString()} tunai!` }, { quoted: m });
            }

            user.wallet -= upahPomen;
            user.vehicle.is_stolen = false; // Bersih daripada buruan polis
            await db.saveUser(user);

            return sock.sendMessage(jid, {
                text: `🔧 *GERAN SIAM & KETUK CHASSIS SELESAI!*\nNombor enjin jentera *${user.vehicle.name}* telah dikikis kemas. Geran bersih diserahkan!\nStatus: *Halal & Bebas Sekatan Jalan Raya*`
            }, { quoted: m });
        }

        // 2. OPERASI CURI KERETA (.curi_kereta)
        if (user.jail?.status && now < user.jail.release_at) {
            return sock.sendMessage(jid, { text: '⛓️ Kau dalam lokap balai, nak curi apa lagi!' }, { quoted: m });
        }

        const cd = 3 * 60 * 1000; // Cooldown 3 minit
        const lastRun = cdCuri.get(senderId) || 0;
        if (now - lastRun < cd) {
            return sock.sendMessage(jid, { text: `⏳ Kawasan panas! Tunggu peronda polis beredar ${Math.ceil((cd - (now - lastRun))/1000)} saat lagi.` }, { quoted: m });
        }
        cdCuri.set(senderId, now);

        // Peluang kantoi 40%
        const kantoi = Math.random() < 0.40;
        if (kantoi) {
            user.jail.status = true;
            user.jail.release_at = now + (3 * 60 * 1000);
            user.jail.reason = "Cubaan Mencuri Kenderaan Awam";
            user.stats.times_jailed = (user.stats.times_jailed || 0) + 1;
            await db.saveUser(user);

            return sock.sendMessage(jid, {
                text: `🚨 *ALARM BERBUNYI: KANTOI BASAH!*\nTengah cucuk wayar starter, anjing pengawal menyalak dan peronda polis tiba!\n⏳ Hukuman: *3 Minit Lokap*`
            }, { quoted: m });
        }

        // Kejayaan: Dapat kereta rawak daripada katalog bajet-sederhana
        const lootPool = VEHICLES.filter(v => v.price <= 90000);
        const jenteraDapat = lootPool[Math.floor(Math.random() * lootPool.length)];

        user.vehicle = {
            name: `${jenteraDapat.name} (Plat Panas)`,
            speed: jenteraDapat.speed,
            tier: jenteraDapat.type,
            is_stolen: true
        };
        user.stats.crimes_done = (user.stats.crimes_done || 0) + 1;
        await db.saveUser(user);

        return sock.sendMessage(jid, {
            text: `
┌───「 🏴‍☠️ 𝗢𝗣𝗘𝗥𝗔𝗦𝗜 𝗞𝗘𝗕𝗔𝗦 𝗝𝗘𝗡𝗧𝗘𝗥𝗔: 𝗕𝗘𝗥𝗝𝗔𝗬𝗔 」
├ 🚗 𝗝𝗲𝗻𝘁𝗲𝗿𝗮 : ${jenteraDapat.name}
├ ⚡ 𝗦𝗽𝗲𝗲𝗱   : ${jenteraDapat.speed} km/h
├ ⚠️ 𝗦𝘁𝗮𝘁𝘂𝘀  : Plat Panas (Risiko Disita LHDN/JPJ)
└───────────────────────────
💡 *Amaran:* Ketuk no chassis guna arahan \`.ketuk_chassis\` (RM 4,500) sebelum enjin disita di sekatan jalan!
💬 𝗔𝗶𝗿𝗶: "Amboi laju tang sebat kereta orang! Bawa lari cepat sebelum tokey dia sedar!"`
        }, { quoted: m });
    }
};
