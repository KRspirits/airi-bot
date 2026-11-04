export default {
    name: 'pasar_gelap',
    alias: ['bm', 'blackmarket', 'beli_telur', 'tetas_telur'],
    execute: async ({ sock, m, args, user, db }) => {
        const jid = m.key.remoteJid;
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const commandUsed = teks.slice(1).trim().split(' ')[0].toLowerCase();
        const now = new Date();

        // Ambil masa zon Malaysia (GMT+8)
        const jam = (now.getUTCHours() + 8) % 24;

        // Jadual Pengoperasian: 12 AM (00:00) hingga 7 AM (07:00)
        const isBuka = (jam >= 0 && jam < 7);

        // 1. SISTEM PENGERAMAN TELUR PET (.beli_telur / .tetas_telur)
        if (commandUsed === 'beli_telur') {
            if (user.inventory.pet_egg) return sock.sendMessage(jid, { text: '❌ Awak dah ada telur dalam inkubator!' }, { quoted: m });
            if (user.wallet < 30000) return sock.sendMessage(jid, { text: '❌ Telur Pet Siber berharga RM 30,000!' }, { quoted: m });

            user.wallet -= 30000;
            user.inventory.pet_egg = true;
            user.inventory.pet_egg_time = Date.now() + (30 * 60 * 1000); // 30 minit pengeraman
            await db.saveUser(user);

            return sock.sendMessage(jid, { text: '🥚 *TELUR PET SIBER DIBELI!*\nTunggu 30 minit pengeraman, kemudian taip `.tetas_telur`!' }, { quoted: m });
        }

        if (commandUsed === 'tetas_telur') {
            if (!user.inventory.pet_egg) return sock.sendMessage(jid, { text: '❌ Awak tiada telur untuk ditetaskan!' }, { quoted: m });
            if (Date.now() < user.inventory.pet_egg_time) {
                const bakiMinit = Math.ceil((user.inventory.pet_egg_time - Date.now()) / 60000);
                return sock.sendMessage(jid, { text: `⏳ Telur masih panas di inkubator! Tunggu ${bakiMinit} minit lagi.` }, { quoted: m });
            }

            const pets = [
                { name: "Doberman Bionik", tier: "B", shield: 20 },
                { name: "AI Sentry Dron", tier: "A", shield: 40 },
                { name: "Serigala Siber Alpha", tier: "S", shield: 60 },
                { name: "Naga Kripto Mythic", tier: "Mythic", shield: 90 }
            ];
            const petDapat = pets[Math.floor(Math.random() * pets.length)];
            user.pet = petDapat;
            user.inventory.pet_egg = false;
            await db.saveUser(user);

            return sock.sendMessage(jid, {
                text: `🐣 *TELUR TELAH MENETAS!*\nTahniah! Awak memperoleh penjaga siber: *${petDapat.name}* [Tier ${petDapat.tier}] (Perisai Bank: +${petDapat.shield}%)!`
            }, { quoted: m });
        }

        // Semakan Jadual Black Market
        if (!isBuka) {
            return sock.sendMessage(jid, {
                text: `🔒 *PASAR GELAP DITUTUP!*\nPasar Gelap hanya dibuka pada jam *12:00 Tengah Malam hingga 7:00 Pagi* sahaja bagi mengelak rondaan pihak berkuasa!\n(Masa Sekarang: ${jam}:00)`
            }, { quoted: m });
        }

        // Menu Barangan Gelap
        const items = {
            1: { name: 'Cyber Bypass Dongle v3', price: 150000, key: 'dongle', desc: 'Alat godam bank simpanan mangsa.' },
            2: { name: 'Telur Pet Siber', price: 30000, key: 'egg', desc: 'Beli telur untuk ditetaskan jadi pet pengawal.' }
        };

        if (!args[0]) {
            let menu = `┌───「 🕳️ 𝗣𝗔𝗦𝗔𝗥 𝗚𝗘𝗟𝗔𝗣 (𝗪𝗔𝗞𝗧𝗨 𝗢𝗣𝗘𝗥𝗔𝗦𝗜: 𝟭𝟮𝗔𝗠 - 𝟳𝗔𝗠) 」\n├───────────────────────────\n`;
            for (const [id, itm] of Object.entries(items)) {
                menu += `├ [${id}] *${itm.name}*\n│   💵 RM ${itm.price.toLocaleString()} — ${itm.desc}\n`;
            }
            menu += `└───────────────────────────\nBeli guna: \`.bm [nombor]\` atau \`.beli_telur\``;
            return sock.sendMessage(jid, { text: menu }, { quoted: m });
        }

        const choice = parseInt(args[0]);
        const target = items[choice];
        if (!target) return sock.sendMessage(jid, { text: '❌ Pilihan tiada dalam senarai!' }, { quoted: m });

        if (user.wallet < target.price) {
            return sock.sendMessage(jid, { text: `❌ Tunai poket tidak cukup RM ${target.price.toLocaleString()}!` }, { quoted: m });
        }

        user.wallet -= target.price;
        if (target.key === 'dongle') {
            user.inventory.dongle = (user.inventory.dongle || 0) + 1;
        }
        await db.saveUser(user);

        return sock.sendMessage(jid, { text: `✅ Berjaya membeli *${target.name}*!` }, { quoted: m });
    }
};
