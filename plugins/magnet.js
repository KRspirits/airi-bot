import { undiItem, gambarItem } from '../lib/magnetitem.js';
export const MAGNET_TIERS = {
    1: { name: 'Magnet Speaker Radio Asas', price: 0, mult: 1.0, maxTier: 1 },
    2: { name: 'Magnet Kuat Neodymium', price: 5000, mult: 1.5, maxTier: 2 },
    3: { name: 'Magnet Industri Kilang', price: 20000, mult: 2.2, maxTier: 3 },
    4: { name: 'Magnet Gergasi Sungai', price: 65000, mult: 3.5, maxTier: 4 },
    5: { name: 'Kren Elektromagnet Pelabuhan', price: 250000, mult: 5.0, maxTier: 5 }
};

const cooldownMagnet = new Map();

export default {
    name: 'baling_magnet',
    alias: ['magnet', 'upgrade_magnet', 'jual_besi', 'buka_peti'],
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const senderId = m.key.participant || jid;
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const args = teks.trim().split(' ').slice(1);
        const commandUsed = teks.slice(1).trim().split(' ')[0].toLowerCase();
        const now = Date.now();

        // 1. UPGRADE MAGNET
        if (commandUsed === 'upgrade_magnet') {
            try {
                const nextTier = (user.magnet?.tier || 1) + 1;
                const targetGear = MAGNET_TIERS[nextTier];

                if (!targetGear) {
                    return sock.sendMessage(jid, { text: '⚡ Magnet awak dah max level (Kren Elektromagnet Pelabuhan)!' }, { quoted: m });
                }

                if (Number(user.wallet || 0) < targetGear.price) {
                    return sock.sendMessage(jid, {
                        text: `❌ Duit poket tak cukup! Upgrade ke *${targetGear.name}* perlu RM ${targetGear.price.toLocaleString()}`
                    }, { quoted: m });
                }

                user.wallet = Number(user.wallet || 0) - targetGear.price;
                user.magnet = { ...(user.magnet || {}), tier: nextTier, name: targetGear.name };
                await db.saveUser(user);

                return sock.sendMessage(jid, {
                    text: `🧲 *UPGRADE BERJAYA!* Sekarang awak guna *${targetGear.name}* (Multiplier Khazanah: x${targetGear.mult})!`
                }, { quoted: m });
            } catch (err) {
                console.error('[MAGNET] upgrade gagal:', err && err.message, '| wallet:', user.wallet, '| tier:', user.magnet?.tier);
                return sock.sendMessage(jid, { text: '❌ Upgrade tak berjaya sekarang. Cuba lagi sebentar, atau bagitahu owner kalau masih sama.' }, { quoted: m });
            }
        }

        // 2. JUAL ITEM MAGNET (dulu jual besi)
        if (commandUsed === 'jual_besi') {
            const simpanan = user.inventory.magnet_items || [];
            if (!simpanan.length) return sock.sendMessage(jid, { text: '❌ Tiada item dari magnet lagi. Taip `.magnet` untuk baling.' }, { quoted: m });

            const jumlah = simpanan.reduce((t, it) => t + (it.harga || 0), 0);
            user.wallet = (user.wallet || 0) + jumlah;
            user.inventory.magnet_items = [];
            await db.saveUser(user);

            return sock.sendMessage(jid, {
                text: `🧲 *JUAL ITEM MAGNET*\nDijual: *${simpanan.length} item*\nHasil: *+RM ${jumlah.toLocaleString()}* masuk wallet!`
            }, { quoted: m });
        }

        // 3. BUKA PETI MISTERI
        if (commandUsed === 'buka_peti') {
            if ((user.inventory.mystery_boxes || 0) <= 0) {
                return sock.sendMessage(jid, { text: '❌ Awak tiada Peti Besi Misteri!' }, { quoted: m });
            }
            user.inventory.mystery_boxes -= 1;

            const ganjaran = [
                { loot: "Ketulan Jongkong Emas Sungai", val: 50000 },
                { loot: "Smartwatch Shadow Eclipse", val: 35000, item: 'smartwatch' },
                { loot: "Telefon Pintar iQOO 12 5G (Kalis Air)", val: 45000, item: 'phone_iqoo' },
                { loot: "Kunci Bilik Rahsia Ah Long", val: 15000 }
            ];
            const hadiah = ganjaran[Math.floor(Math.random() * ganjaran.length)];
            user.wallet += hadiah.val;
            if (hadiah.item) user.inventory[hadiah.item] = true;
            await db.saveUser(user);

            return sock.sendMessage(jid, {
                text: `🔓 *PETI BESI DIBUKA!*\nKhazanah: *${hadiah.loot}*\nNilai Tunai: *+RM ${hadiah.val.toLocaleString()}*`
            }, { quoted: m });
        }

        // 4. BALING MAGNET DASAR SUNGAI

        const cd = 90 * 1000;
        const lastRun = cooldownMagnet.get(senderId) || 0;
        if (now - lastRun < cd) {
            return sock.sendMessage(jid, { text: `⏳ Tali sangkut lumpur! Tunggu ${Math.ceil((cd - (now - lastRun)) / 1000)} saat lagi.` }, { quoted: m });
        }
        cooldownMagnet.set(senderId, now);

        const currentTier = user.magnet?.tier || 1;
        user.stats = user.stats || {};
        user.stats.magnet_tarik = (user.stats.magnet_tarik || 0) + 1;

        // Harta karun: jarang (0.5% x tier), nilai naik mengikut tier
        if (Math.random() < 0.005 * currentTier) {
            const nilai = Math.round((5000 + Math.random() * 25000) * (0.8 + currentTier * 0.1) / 10) * 10;
            user.wallet += nilai;
            user.stats.magnet_treasure = (user.stats.magnet_treasure || 0) + 1;
            await db.saveUser(user);
            return sock.sendMessage(jid, {
                text: `💎 *HARTA KARUN!*\nMagnet awak tarik sesuatu berkilau dari dasar sungai!\nNilai: *+RM ${nilai.toLocaleString()}*`
            }, { quoted: m });
        }

        const roll = Math.random();

        // Peluang Peti Misteri mengikut tier
        if (roll < (0.10 * currentTier)) {
            user.inventory.mystery_boxes = (user.inventory.mystery_boxes || 0) + 1;
            await db.saveUser(user);
            return sock.sendMessage(jid, {
                text: `🧲 *JACKPOT DASAR AIR!*\nMagnet awak melekat pada sebuah *Peti Besi Misteri*!\nTaip \`.buka_peti\` untuk membukanya!`
            }, { quoted: m });
        }

        // Loot item magnet (ikut tier, bukan besi)
        const item = undiItem(currentTier);
        user.inventory.magnet_items = [...(user.inventory.magnet_items || []), { id: item.id, nama: item.nama, tier: item.tier, jenis: item.jenis, harga: item.harga }];
        await db.saveUser(user);

        const gambar = gambarItem(item);
        const teksItem = `┌───「 🧲 𝗧𝗔𝗥𝗜𝗞𝗔𝗡 𝗠𝗔𝗚𝗡𝗘𝗧 」\n├ ⚙️ 𝗚𝗲𝗮𝗿  : ${MAGNET_TIERS[currentTier].name}\n├ 🎁 𝗜𝘁𝗲𝗺  : ${item.nama}\n├ 🏷️ 𝗧𝗶𝗲𝗿  : ${item.tier} · ${item.jenis}\n├ 💵 𝗡𝗶𝗹𝗮𝗶 : RM ${item.harga.toLocaleString()}\n└───────────────────────────\nTaip \`.jual_besi\` untuk jual semua item, atau \`.upgrade_magnet\`!`;
        return gambar
            ? sock.sendMessage(jid, { image: gambar, caption: teksItem }, { quoted: m })
            : sock.sendMessage(jid, { text: teksItem }, { quoted: m });
    }
};
