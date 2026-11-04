import { PHONE_DEVICES } from '../lib/gamedata.js';

export default {
    name: 'device',
    alias: ['beli_phone', 'shop', 'beli_makanan', 'makan'],
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const args = teks.trim().split(' ').slice(1);
        const cmd = teks.slice(1).trim().split(' ')[0].toLowerCase();

        // 1. KATALOG 20 PERANTI PINTAR (.device)
        if (cmd === 'device') {
            let list = `┌───「 📱 𝗞𝗘𝗗𝗔𝗜 𝗚𝗔𝗝𝗘𝗧 & 𝗣𝗘𝗥𝗔𝗡𝗧𝗜 𝗣𝗜𝗡𝗧𝗔𝗥 」\n├───────────────────────────\n`;
            PHONE_DEVICES.forEach(p => {
                list += `├ [${p.id}] *${p.name}*\n│   💵 RM ${p.price.toLocaleString()} | ✨ ${p.bonus}\n`;
            });
            list += `└───────────────────────────\nBeli guna arahan: \`.beli_phone [id]\``;

            return sock.sendMessage(jid, { text: list }, { quoted: m });
        }

        // 2. BELI PERANTI PINTAR (.beli_phone [id])
        if (cmd === 'beli_phone') {
            const pId = args[0]?.toLowerCase();
            const phone = PHONE_DEVICES.find(p => p.id === pId);

            if (!phone) return sock.sendMessage(jid, { text: '❌ Kod peranti tidak wujud!' }, { quoted: m });

            if (user.wallet < phone.price) {
                return sock.sendMessage(jid, { text: `❌ Duit poket awak tak cukup RM ${phone.price.toLocaleString()}!` }, { quoted: m });
            }

            user.wallet -= phone.price;
            user.inventory.phone = pId;
            user.inventory.phone_name = phone.name;
            user.inventory.phone_iqoo = (pId === 'iqoo12');
            await db.saveUser(user);

            return sock.sendMessage(jid, {
                text: `📱 *PERANTI DIHANTAR!*\nKau berjaya membeli *${phone.name}*!\nKelebihan Aktif: _${phone.bonus}_`
            }, { quoted: m });
        }

        // 3. WARUNG MAKANAN RESET COOLDOWN (.shop / .beli_makanan)
        if (cmd === 'shop' || cmd === 'beli_makanan' || cmd === 'makan') {
            return sock.sendMessage(jid, {
                text: `🍔 *WARUNG MAKANAN MALAYSIA*\n1. Teh Tarik Buih (Potong 10s cooldown) — RM 4\n2. Roti Canai Banjir (Potong 20s cooldown) — RM 7\n3. Nasi Lemak Sambal Sotong (Reset SERTA-MERTA semua cooldown kerja!) — RM 12\n\nTaip \`.makan [nombor]\` untuk menikmati hidangan!`
            }, { quoted: m });
        }
    }
};
