import { VEHICLES } from '../lib/gamedata.js';

export default {
    name: 'showroom',
    alias: ['beli_kenderaan', 'bengkel', 'pasang'],
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const args = teks.trim().split(' ').slice(1);
        const cmd = teks.slice(1).trim().split(' ')[0].toLowerCase();

        // 1. LIHAT SHOWROOM MENGIKUT MUKA SURAT (.showroom [page])
        if (cmd === 'showroom') {
            const page = parseInt(args[0]) || 1;
            const itemPerMuka = 15;
            const start = (page - 1) * itemPerMuka;
            const paparan = VEHICLES.slice(start, start + itemPerMuka);

            let katalog = `┌───「 🏎️ 𝗦𝗛𝗢𝗪𝗥𝗢𝗢𝗠 𝗠𝗘𝗚𝗔 (𝗠𝗨𝗞𝗔 𝗦𝗨𝗥𝗔𝗧 ${page}/5) 」\n├───────────────────────────\n`;
            paparan.forEach(v => {
                katalog += `├ [${v.id}] *${v.name}*\n│   ⚡ Kelajuan: ${v.speed} km/h | 💵 RM ${v.price.toLocaleString()}\n`;
            });
            katalog += `└───────────────────────────\nTaip \`.showroom [1-5]\` untuk muka surat lain.\nBeli guna: \`.beli_kenderaan [id]\``;

            return sock.sendMessage(jid, { text: katalog }, { quoted: m });
        }

        // 2. BELI JENTERA BERSERTA IMEJ RENDER AI (.beli_kenderaan [id])
        if (cmd === 'beli_kenderaan') {
            const vId = args[0]?.toLowerCase();
            const car = VEHICLES.find(v => v.id === vId);

            if (!car) return sock.sendMessage(jid, { text: '❌ Kod jentera tidak sah! Semak di `.showroom`.' }, { quoted: m });

            if (user.wallet < car.price) {
                return sock.sendMessage(jid, { text: `❌ Duit poket kau tak cukup RM ${car.price.toLocaleString()}!` }, { quoted: m });
            }

            user.wallet -= car.price;
            user.vehicle = { name: car.name, speed: car.speed, tier: car.type };
            await db.saveUser(user);

            // Menjana render visual berdefinisi tinggi menggunakan Pollinations AI
            const prompt = encodeURIComponent(`photorealistic high detail ${car.name.replace(/[^a-zA-Z0-9 ]/g, '')}, 4k render, cinematic lighting, cyberpunk street background`);
            const urlGambar = `https://image.pollinations.ai/prompt/${prompt}?width=512&height=512&nologo=true`;

            return sock.sendMessage(jid, {
                image: { url: urlGambar },
                caption: `🎉 *KUNCI DISERAHKAN!*\n\nTahniah! Anda kini pemilik sah jentera *${car.name}*.\n⚡ Kelajuan Asas: *${car.speed} km/h*`
            }, { quoted: m });
        }

        // 3. BENGKEL MODIFIKASI (.bengkel)
        if (cmd === 'bengkel' || cmd === 'pasang') {
            return sock.sendMessage(jid, {
                text: `🛠️ *BENGKEL TUNING PERFORMANCE*\n1. ECU Remap Stage 1 (+15 km/h) — RM 3,500\n2. Tayar Slick Toyo (+10 km/h) — RM 2,400\n3. Turbo Garrett Ball-Bearing (+30 km/h) — RM 7,500\n\nGuna: \`.pasang [no_mod]\` untuk menaik taraf kelajuan!`
            }, { quoted: m });
        }
    }
};
