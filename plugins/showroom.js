export const SENARAI_KERETA = {
    1: { name: 'Perodua Kancil 660 (Lompat Turbo)', price: 4500, speed: 45, tier: 'D', desc: 'Kecil tapi menyusup laju celah jammed.' },
    2: { name: 'Proton Wira 1.5 Aeroback (Ekor Itik)', price: 9500, speed: 65, tier: 'C', desc: 'Legenda litar haram malam minggu.' },
    3: { name: 'Proton Satria Neo CPS (Tuned)', price: 22000, speed: 85, tier: 'B', desc: 'Cornering Bukit Ampang tak buang minyak.' },
    4: { name: 'Perodua Myvi Gen 3 (King Highway)', price: 48000, speed: 110, tier: 'A', desc: 'Kereta rasmi pembuli lorong kanan Karak.' },
    5: { name: 'Nissan Silvia S15 (Geran Siam)', price: 120000, speed: 150, tier: 'S', desc: 'Raja drift bawah jambatan Pulau Pinang.' }
};

export default {
    name: 'showroom',
    alias: ['kedai_kereta', 'beli_kenderaan', 'garaj'],
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const args = teks.trim().split(' ').slice(1);
        const commandUsed = teks.slice(1).trim().split(' ')[0].toLowerCase();

        // 1. BELI KERETA (.beli_kenderaan [no])
        if (commandUsed === 'beli_kenderaan') {
            const noPilihan = parseInt(args[0]);
            const keretaDipilih = SENARAI_KERETA[noPilihan];

            if (!keretaDipilih) {
                return sock.sendMessage(jid, { 
                    text: '❌ Pilihan tak wujud! Taip `.showroom` untuk tengok senarai jentera.' 
                }, { quoted: m });
            }

            if (user.wallet < keretaDipilih.price) {
                return sock.sendMessage(jid, { 
                    text: `❌ Duit poket kau tak cukup! Perlukan RM ${keretaDipilih.price.toLocaleString()} tapi ada RM ${user.wallet.toLocaleString()} je.` 
                }, { quoted: m });
            }

            // Tolak duit dan update jentera
            user.wallet -= keretaDipilih.price;
            user.vehicle = {
                name: keretaDipilih.name,
                speed: keretaDipilih.speed,
                price: keretaDipilih.price,
                tier: keretaDipilih.tier
            };
            await db.saveUser(user);

            const responBeli = `
┌───「 🏎️ 𝗣𝗘𝗡𝗗𝗔𝗙𝗧𝗔𝗥𝗔𝗡 𝗝𝗘𝗡𝗧𝗘𝗥𝗔 」
├ 🚗 𝗠𝗼𝗱𝗲𝗹 : ${keretaDipilih.name}
├ ⚡ 𝗦𝗽𝗲𝗲𝗱 : ${keretaDipilih.speed} Km/j Base
├ 🏷️ 𝗧𝗶𝗲𝗿   : [ ${keretaDipilih.tier} ]
├ 💵 𝗛𝗮𝗿𝗴𝗮 : RM ${keretaDipilih.price.toLocaleString()}
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "Pergh dah ada jentera baru! Jangan bagi enjin barai dekat Karak malam ni!"`;

            return sock.sendMessage(jid, { text: responBeli }, { quoted: m });
        }

        // 2. LIHAT SHOWROOM (.showroom)
        let katalog = `
┌───「 🏁 𝗦𝗛𝗢𝗪𝗥𝗢𝗢𝗠 𝗝𝗘𝗡𝗧𝗘𝗥𝗔 𝗟𝗢𝗞𝗔𝗟 」
│ _Pilih jentera untuk tapau musuh di jalanan._
├───────────────────────────\n`;

        for (const [id, car] of Object.entries(SENARAI_KERETA)) {
            katalog += `├ [${id}] *${car.name}* [Tier ${car.tier}]\n│   ⚡ Kelajuan: ${car.speed} Km/j\n│   💵 Harga   : RM ${car.price.toLocaleString()}\n│   ℹ️ Sifat   : ${car.desc}\n`;
        }

        katalog += `└───────────────────────────
🚘 *Jentera Semasa Kau:* ${user.vehicle?.name || 'Kaki Bangku'}
Guna: \`.beli_kenderaan [nombor]\` untuk beli jentera.
💬 𝗔𝗶𝗿𝗶: "Kumpul duit beli Myvi King la baru ada gaya!"`;

        return sock.sendMessage(jid, { text: katalog }, { quoted: m });
    }
};
