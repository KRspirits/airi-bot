import { renderIC } from '../lib/idcards.js';
export default {
    name: 'myid',
    alias: ['ic', 'profile'],
    execute: async ({ sock, m, user }) => {
        const jid = m.key.remoteJid;
        const senderName = m.pushName || 'Warga Gelap';
        const senderNumber = (m.key.participant || jid).split('@')[0];

        const totalKekayaan = user.wallet + user.bank + (user.black_money || 0);

        const teksId = `
┌───「 🪪 𝗞𝗔𝗗 𝗣𝗘𝗡𝗚𝗘𝗡𝗔𝗟𝗔𝗡 𝗦𝗜𝗕𝗘𝗥 𝗖𝗬𝗕𝗘𝗥 𝗢𝗦 」
├ 👤 𝗡𝗮𝗺𝗮     : ${senderName}
├ 🆔 𝗡𝗼. 𝗜𝗖    : AC2026-${senderNumber.slice(-4)}-AIRI
├ 💵 𝗧𝘂𝗻𝗮𝗶 (𝗖𝗮𝘀𝗵): RM ${user.wallet.toLocaleString()}
├ 🏦 𝗦𝗶𝗺𝗽𝗮𝗻𝗮𝗻  : RM ${user.bank.toLocaleString()}
├ 🏴‍☠️ 𝗗𝘂𝗶𝘁 𝗞𝗼𝘁𝗼𝗿 : RM ${(user.black_money || 0).toLocaleString()}
├ 📊 𝗧𝗼𝘁𝗮𝗹 𝗔𝘀𝗲𝘁: RM ${totalKekayaan.toLocaleString()}
├ 🏎️ 𝗝𝗲𝗻𝘁𝗲𝗿𝗮   : ${user.vehicle?.name || 'Jalan Kaki'}
├ 🐺 𝗣𝗲𝘁 𝗦𝗶𝗯𝗲𝗿 : ${user.pet?.name || 'Tiada'} [Tier ${user.pet?.tier || 'None'}]
├ 🧲 𝗠𝗮𝗴𝗻𝗲𝘁    : ${user.magnet?.name || 'Asas'}
└───────────────────────────
✅ *Profil Aktif & Tersimpan dalam Pangkalan Data.*
💬 𝗔𝗶𝗿𝗶: "Simpan rekod ni elok-elok, jangan sampai terpadam waktu reset nanti!"`;

        try {
            const img = renderIC(user, senderName);
            return sock.sendMessage(jid, { image: img, caption: `🪪 Kad pengenalan kau\nTunai: RM ${user.wallet.toLocaleString()} · Bank: RM ${user.bank.toLocaleString()}` }, { quoted: m });
        } catch (e) {
            console.error('[KAD IC]', e.message);
        }
        return sock.sendMessage(jid, { text: teksId }, { quoted: m });
    }
};
