const SENARAI_HARTANAH = {
    1: { id: 'h1', name: 'Warung Tomyam Kelantan', price: 35000, income: 4500 },
    2: { id: 'h2', name: 'Tapak Carwash 24 Jam', price: 90000, income: 12000 },
    3: { id: 'h3', name: 'Kebun Musang King Raub', price: 300000, income: 45000 }
};

export default {
    name: 'hartanah',
    alias: ['list_hartanah', 'beli_rumah', 'kutip_sewa'],
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const args = teks.trim().split(' ').slice(1);
        const commandUsed = teks.slice(1).trim().split(' ')[0].toLowerCase();
        const now = Date.now();

        // 1. KUTIP HASIL SEWA (.kutip_sewa)
        if (commandUsed === 'kutip_sewa') {
            const props = user.properties || [];
            if (props.length === 0) return sock.sendMessage(jid, { text: '❌ Awak tiada hartanah! Beli guna `.beli_rumah [no]`.' }, { quoted: m });

            let totalKutipan = 0;
            const COOLDOWN_SEWA = 24 * 60 * 60 * 1000; // 24 Jam sekali

            props.forEach(p => {
                if (!p.last_claim || (now - p.last_claim) > COOLDOWN_SEWA) {
                    totalKutipan += p.income;
                    p.last_claim = now;
                }
            });

            if (totalKutipan === 0) {
                return sock.sendMessage(jid, { text: '⏳ Penyewa belum bayar sewa hari ini. Datang kutip esok!' }, { quoted: m });
            }

            user.wallet += totalKutipan;
            await db.saveUser(user);

            return sock.sendMessage(jid, {
                text: `🏢 *KUTIPAN SEWA SELESAI!*\nJumlah wang sewa dikutip: *+RM ${totalKutipan.toLocaleString()}*`
            }, { quoted: m });
        }

        // 2. BELI HARTANAH (.beli_rumah [no])
        if (commandUsed === 'beli_rumah') {
            const no = parseInt(args[0]);
            const target = SENARAI_HARTANAH[no];

            if (!target) return sock.sendMessage(jid, { text: '❌ Nombor hartanah tidak wujud! Taip `.list_hartanah`.' }, { quoted: m });

            if (user.bank < target.price) {
                return sock.sendMessage(jid, { text: `❌ Baki bank tidak mencukupi! Perlu RM ${target.price.toLocaleString()} dalam akaun.` }, { quoted: m });
            }

            user.bank -= target.price;
            if (!user.properties) user.properties = [];
            user.properties.push({
                id: target.id,
                name: target.name,
                income: target.income,
                last_claim: now
            });
            await db.saveUser(user);

            return sock.sendMessage(jid, {
                text: `🏠 *PEMBELIAN HARTANAH BERJAYA!*\nKau kini pemilik sah *${target.name}*!\nKutip hasil harian guna \`.kutip_sewa\`.`
            }, { quoted: m });
        }

        // 3. SENARAI HARTANAH (.list_hartanah)
        let katalog = `┌───「 🏘️ 𝗛𝗔𝗥𝗧𝗔𝗡𝗔𝗛 𝗕𝗘𝗥𝗡𝗜𝗟𝗔𝗜 𝗧𝗜𝗡𝗚𝗚𝗜 」\n├───────────────────────────\n`;
        for (const [id, h] of Object.entries(SENARAI_HARTANAH)) {
            katalog += `├ [${id}] *${h.name}*\n│   💵 Harga : RM ${h.price.toLocaleString()}\n│   📈 Hasil : RM ${h.income.toLocaleString()} / hari\n`;
        }
        katalog += `└───────────────────────────\nBeli guna: \`.beli_rumah [no]\`\nKutip sewa: \`.kutip_sewa\``;

        return sock.sendMessage(jid, { text: katalog }, { quoted: m });
    }
};
