import { MAGNET_TIERS } from './magnet.js';

// 🧲 KEDAI MAGNET. Lihat tahap magnet dan beli tahap seterusnya.
//   .kedai_magnet          -> senarai semua tahap, harga dan status
//   .kedai_magnet beli     -> beli tahap seterusnya (mesti berurutan)
export default {
    name: 'kedai_magnet',
    alias: [],
    category: 'pancing',
    execute: async ({ sock, m, user, db, args = [] }) => {
        const jid = m.key.remoteJid;
        const reply = t => sock.sendMessage(jid, { text: t }, { quoted: m });
        const rp = n => `RM ${Math.round(Number(n) || 0).toLocaleString('en-US')}`;
        const sekarang = user.magnet?.tier || 1;
        const max = Math.max(...Object.keys(MAGNET_TIERS).map(Number));

        if ((args[0] || '').toLowerCase() === 'beli') {
            const seterusnya = sekarang + 1;
            const tahap = MAGNET_TIERS[seterusnya];
            if (!tahap) return reply('⚡ Magnet awak dah tahap paling tinggi!');
            if ((user.wallet || 0) < tahap.price) return reply(`❌ Duit tak cukup. *${tahap.name}* perlu ${rp(tahap.price)}, awak ada ${rp(user.wallet || 0)}.`);
            user.wallet -= tahap.price;
            user.magnet = { ...(user.magnet || {}), tier: seterusnya, name: tahap.name };
            await db.saveUser(user);
            return reply(`🧲 *BERJAYA BELI!* Sekarang awak guna *${tahap.name}* (x${tahap.mult} khazanah).\nBaki: ${rp(user.wallet)}`);
        }

        const baris = Object.entries(MAGNET_TIERS).map(([k, t]) => {
            const n = Number(k);
            const status = n < sekarang ? '✅ Dah ada' : n === sekarang ? '🔵 Sedang guna' : n === sekarang + 1 ? '🛒 Boleh beli' : '🔒 Kunci';
            return `${status} · Tahap ${n}: *${t.name}*\n   Harga ${n === 1 ? 'Percuma' : rp(t.price)} · khazanah x${t.mult}`;
        });
        const seterusnya = MAGNET_TIERS[sekarang + 1];
        return reply(`🧲 *KEDAI MAGNET*\n\n${baris.join('\n\n')}\n\n${seterusnya ? `Beli tahap seterusnya: \`.kedai_magnet beli\` (${rp(seterusnya.price)})` : `Tahap paling tinggi (${max}) dah dicapai.`}`);
    }
};
