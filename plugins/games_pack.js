export default {
    name: 'games_pack',
    alias: ['slot', 'bgk', 'lumba_kuda', 'gacha_mlbb', 'coinflip', 'kotak_beracun', 'tembak_botol'],
    execute: async ({ sock, m, user, db }) => {
        try {
            const jid = m.key.remoteJid;
            const senderJid = m.key.participant || jid; // Hanya tag pemain yang taip arahan
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

            if (cmd === 'coinflip') {
                const tekaan = args[0]?.toLowerCase();
                const modal = parseInt(args[1]) || 500;
                if (!['kepala', 'ekor'].includes(tekaan)) return sock.sendMessage(jid, { text: `❌ Format: \`.coinflip [kepala/ekor] [modal]\`` }, { quoted: m });
                if (user.wallet < modal) return sock.sendMessage(jid, { text: `❌ Modal tak cukup!` }, { quoted: m });

                const syiling = Math.random() > 0.5 ? 'kepala' : 'ekor';
                if (tekaan === syiling) {
                    user.wallet += modal;
                    await db.saveUser(user);
                    return sock.sendMessage(jid, { text: `🪙 Syiling jatuh pada: *${syiling.toUpperCase()}*\n\n✅ Tepat! Kau menang RM ${modal.toLocaleString()}` }, { quoted: m });
                } else {
                    user.wallet -= modal;
                    await db.saveUser(user);
                    return sock.sendMessage(jid, { text: `🪙 Syiling jatuh pada: *${syiling.toUpperCase()}*\n\n❌ Salah! Modal RM ${modal.toLocaleString()} hangus.` }, { quoted: m });
                }
            }

            if (cmd === 'kotak_beracun') {
                const pilihan = parseInt(args[0]);
                if (![1, 2, 3].includes(pilihan)) return sock.sendMessage(jid, { text: `📦 Pilih kotak: \`.kotak_beracun [1/2/3]\`` }, { quoted: m });
                
                const racun = Math.floor(Math.random() * 3) + 1;
                if (pilihan === racun) {
                    user.wallet = Math.max(0, user.wallet - 5000);
                    await db.saveUser(user);
                    return sock.sendMessage(jid, { text: `☠️ *KABOOM!*\n\nKotak ${pilihan} ada bom beracun! Duit kau hangus RM 5,000!` }, { quoted: m });
                } else {
                    const hadiah = Math.floor(Math.random() * 3000) + 1000;
                    user.wallet += hadiah;
                    await db.saveUser(user);
                    return sock.sendMessage(jid, { text: `🎁 Selamat! Kotak ${pilihan} berisi RM ${hadiah.toLocaleString()}.` }, { quoted: m });
                }
            }

            if (cmd === 'tembak_botol') {
                const nasib = Math.random();
                if (nasib > 0.4) {
                    user.wallet += 1500;
                    await db.saveUser(user);
                    return sock.sendMessage(jid, { text: `🔫 *BANG! PRANGGG!*\n\nTembakan tepat kena botol! Kau menang RM 1,500.` }, { quoted: m });
                } else {
                    return sock.sendMessage(jid, { text: `🔫 *BANG!* ...tersasar.\n\nPeluru kau terkena dinding. Cuba lagi!` }, { quoted: m });
                }
            }

            if (cmd === 'lumba_kuda' || cmd === 'gacha_mlbb') {
                const items = cmd === 'lumba_kuda' ? ['Kuda Hitam', 'Kuda Putih', 'Kuda Belang', 'Kuda Merah'] : ['Epic', 'Elite', 'Basic', 'Collector (Rare!)', 'Habuk (Gagal)'];
                const msg = cmd === 'lumba_kuda' ? `🐎 Juara lumba kali ini ialah: *${items[Math.floor(Math.random() * items.length)]}*!` : `🔮 Gacha MLBB... Kau dapat: *${items[Math.floor(Math.random() * items.length)]}* ✨`;
                return sock.sendMessage(jid, { text: msg }, { quoted: m });
            }

        } catch (err) {
            console.error("Games Error:", err);
        }
    }
};
