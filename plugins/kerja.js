import { beriXp } from '../lib/xp.js';
// Simpan rekod waktu kerja sementara dalam memori
const cooldownKerja = new Map();

export default {
    name: 'kerja',
    alias: ['work'],
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const senderId = m.key.participant || m.key.remoteJid;
        const now = Date.now();

        // Semak lokap
        if (user.jail?.status && now < user.jail.release_at) {
            return sock.sendMessage(jid, { 
                text: '❌ Dalam lokap mana ada kerja! Pergi kutip puntung rokok sana.' 
            }, { quoted: m });
        }

        // Semak Cooldown (Contoh: 3 minit rehat)
        const COOLDOWN_TIME = 3 * 60 * 1000;
        const lastWork = cooldownKerja.get(senderId) || 0;

        if (now - lastWork < COOLDOWN_TIME) {
            const bakiSaat = Math.ceil((COOLDOWN_TIME - (now - lastWork)) / 1000);
            return sock.sendMessage(jid, { 
                text: `⏳ Penat la tu! Rehat minum kopi mamak dulu. Tunggu ${bakiSaat} saat lagi.` 
            }, { quoted: m });
        }

        const senaraiKerja = [
            {
                jawatan: "Rider Penghantar Makanan Waktu Hujan",
                minGaji: 250, maxGaji: 600,
                cerita: "Redah banjir kilat KL hantar burger bakar. Dapat tips lebih sebab customer kesian.",
                roast: "Fuh gigih redah air, enjin moto jangan masuk air sudah la."
            },
            {
                jawatan: "Tukang Tebar Roti Canai Mamak Pelita",
                minGaji: 300, maxGaji: 750,
                cerita: "Tebar roti sampai melayang sangkut kat kipas siling. Pelanggan tetap tepuk tangan!",
                roast: "Skill tebar dah ada, tapi kuah kari rasa tawar sikit harini."
            },
            {
                jawatan: "Operator Tol Highway Karak",
                minGaji: 200, maxGaji: 500,
                cerita: "Shift malam tenang bertemankan kabut tebal dan bunyi ekzos Satria memecah hening.",
                roast: "Duduk kutip duit tol je pun penat ke? Santai sikit bro."
            },
            {
                jawatan: "Penyusun Rak Barang Pasaraya Mydin",
                minGaji: 180, maxGaji: 450,
                cerita: "Susun tin sardin bertingkat-tingkat tanpa tumbang waktu promosi gila-gila.",
                roast: "Gaji cukup-cukup beli megi je ni, sambung buat kerja lagi!"
            }
        ];

        const job = senaraiKerja[Math.floor(Math.random() * senaraiKerja.length)];
        const gaji = Math.floor(Math.random() * (job.maxGaji - job.minGaji + 1)) + job.minGaji;

        user.wallet += gaji;
        beriXp(user, 10, 'kerja');
        await db.saveUser(user);
        cooldownKerja.set(senderId, now);

        const respon = `
┌───「 💼 𝗣𝗘𝗡𝗝𝗔𝗡𝗔𝗔𝗡 𝗚𝗔𝗝𝗜: 𝗦𝗘𝗟𝗘𝗦𝗔𝗜 」
├ 🛠️ 𝗝𝗮𝘄𝗮𝘁𝗮𝗻 : ${job.jawatan}
├ 💵 𝗨𝗽𝗮𝗵     : +RM ${gaji.toLocaleString()}
├ 📝 𝗖𝗮𝘁𝗮𝘁𝗮𝗻 : ${job.cerita}
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "${job.roast}"`;

        return sock.sendMessage(jid, { text: respon }, { quoted: m });
    }
};
