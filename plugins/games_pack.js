export default {
    name: 'games_pack',
    alias: ['slot', 'bgk', 'lumba_kuda', 'gacha_mlbb'],
    execute: async ({ sock, m, user, db }) => {
        try {
            const jid = m.key.remoteJid;
            const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
            const args = teks.trim().split(' ').slice(1);
            const cmd = teks.slice(1).trim().split(' ')[0].toLowerCase();

            if (cmd === 'slot') {
                const modal = parseInt(args[0]) || 1000;
                if (user.wallet < modal) return sock.sendMessage(jid, { text: `❌ Duit poket tak cukup RM ${modal.toLocaleString()}!` }, { quoted: m });
                
                const emoji = ['🍒', '🍋', '🔔', '💎'];
                const a = emoji[Math.floor(Math.random() * emoji.length)];
                const b = emoji[Math.floor(Math.random() * emoji.length)];
                const c = emoji[Math.floor(Math.random() * emoji.length)];
                
                if (a === b && b === c) {
                    const menang = modal * 10;
                    user.wallet += menang;
                    await db.saveUser(user);
                    return sock.sendMessage(jid, { text: `🎰 [ ${a} | ${b} | ${c} ]\n\n🔥 *JACKPOT!* Kau menang RM ${menang.toLocaleString()}!` }, { quoted: m });
                } else {
                    user.wallet -= modal;
                    await db.saveUser(user);
                    return sock.sendMessage(jid, { text: `🎰 [ ${a} | ${b} | ${c} ]\n\n❌ Rugi RM ${modal.toLocaleString()}... Cuba lagi!` }, { quoted: m });
                }
            }

            if (cmd === 'bgk') {
                const pilihanUser = args[0]?.toLowerCase();
                if (!['batu', 'gunting', 'kertas'].includes(pilihanUser)) {
                    return sock.sendMessage(jid, { text: `❌ Format: \`.bgk [batu/gunting/kertas]\`` }, { quoted: m });
                }
                const pilihanBot = ['batu', 'gunting', 'kertas'][Math.floor(Math.random() * 3)];
                const hasil = (pilihanUser === pilihanBot) ? 'SERI 🤝' 
                            : (pilihanUser === 'batu' && pilihanBot === 'gunting') || (pilihanUser === 'gunting' && pilihanBot === 'kertas') || (pilihanUser === 'kertas' && pilihanBot === 'batu') ? 'KAU MENANG! 🎉' 
                            : 'KAU KALAH! 🤣';
                return sock.sendMessage(jid, { text: `✊ KAU: ${pilihanUser.toUpperCase()}\n🤖 AIRI: ${pilihanBot.toUpperCase()}\n\nKeputusan: ${hasil}` }, { quoted: m });
            }

            if (cmd === 'gacha_mlbb') {
                const skin = ['Epic', 'Elite', 'Basic', 'Collector (Rare!)', 'Habuk (Gagal)'];
                const dpt = skin[Math.floor(Math.random() * skin.length)];
                return sock.sendMessage(jid, { text: `🔮 *GACHA MLBB DITEKAN...*\n\nTahniah! Kau dapat skin: *${dpt}* ✨` }, { quoted: m });
            }

            if (cmd === 'lumba_kuda') {
                const kuda = ['Kuda Hitam', 'Kuda Putih', 'Kuda Belang', 'Kuda Merah'];
                const pemenang = kuda[Math.floor(Math.random() * kuda.length)];
                return sock.sendMessage(jid, { text: `🐎 *LUMBA KUDA BERMULA!*\n\nDebu berterbangan di litar... Dan juara perlumbaan kali ini ialah: *${pemenang}*! 🏁` }, { quoted: m });
            }

        } catch (err) {
            console.error("Games Error:", err);
        }
    }
};
