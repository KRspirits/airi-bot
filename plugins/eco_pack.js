export default {
    name: 'eco_pack',
    alias: [
        'beli_emas', 'jual_emas', 'beli_btc', 'jual_btc'
    ],
    execute: async ({ sock, m, user, db }) => {
        try {
            const jid = m.key.remoteJid;
            const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
            const args = teks.trim().split(' ').slice(1);
            const cmd = teks.slice(1).trim().split(' ')[0].toLowerCase();

            // Pastikan objek crypto wujud untuk elak ralat
            if (!user.crypto) user.crypto = { gold: 0, btc: 0 };

            if (cmd === 'bal') {
                return sock.sendMessage(jid, { 
                    text: `💳 *AKAUN BANK AIRI*\n\n💵 Tunai Poket: RM ${(user.wallet || 0).toLocaleString()}\n🏦 Baki Bank: RM ${(user.bank || 0).toLocaleString()}\n💸 Duit Haram: RM ${(user.dirty_money || 0).toLocaleString()}\n\n📊 *ASET PELABURAN*\n🥇 Emas: ${(user.crypto.gold || 0)} Jongkong\n🪙 Bitcoin: ${(user.crypto.btc || 0)} BTC` 
                }, { quoted: m });
            }

            if (cmd === 'kerja') {
                const now = Date.now();
                if (user.lastKerja && (now - user.lastKerja < 300000)) { 
                    return sock.sendMessage(jid, { text: `⏳ Penat bos! Rehat dulu 5 minit sebelum kerja balik.` }, { quoted: m });
                }
                const senaraiKerja = ['GrabFood', 'Jual Burger', 'Jaga Tol', 'Kutip Tin', 'Bawa Lori'];
                const job = senaraiKerja[Math.floor(Math.random() * senaraiKerja.length)];
                const gaji = Math.floor(Math.random() * 2000) + 500;
                
                user.wallet = (user.wallet || 0) + gaji;
                user.lastKerja = now;
                await db.saveUser(user);
                return sock.sendMessage(jid, { text: `💼 Awak kerja sebagai *${job}* dan dibayar RM ${gaji.toLocaleString()}!` }, { quoted: m });
            }

            if (cmd === 'transfer_lama') { // digantikan oleh plugins/transfer.js
                const targetJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
                const jumlah = parseInt(args[1]);
                if (!targetJid || !jumlah || isNaN(jumlah)) return sock.sendMessage(jid, { text: `❌ Format: \`.transfer @user [jumlah]\`` }, { quoted: m });
                if (user.wallet < jumlah) return sock.sendMessage(jid, { text: `❌ Duit poket tak cukup!` }, { quoted: m });

                const targetUser = await db.getUser(targetJid);
                user.wallet -= jumlah;
                targetUser.wallet = (targetUser.wallet || 0) + jumlah;
                await db.saveUser(user);
                await db.saveUser(targetUser);

                return sock.sendMessage(jid, { text: `✅ Berjaya transfer RM ${jumlah.toLocaleString()} kepada @${targetJid.split('@')[0]}`, mentions: [targetJid] }, { quoted: m });
            }

            if (cmd === 'pasaran') {
                return sock.sendMessage(jid, { 
                    text: `📊 *PASARAN GLOBAL AIRI*\n\n🥇 *Emas*\nBeli: RM 5,000 / Jongkong\nJual: RM 4,500 / Jongkong\n\n🪙 *Bitcoin (BTC)*\nBeli: RM 250,000 / BTC\nJual: *Harga Pasaran Bebas* (Risiko turun naik)\n\n*Guna:* \`.beli_btc [jumlah]\` atau \`.jual_btc [jumlah]\`` 
                }, { quoted: m });
            }

            // --- SISTEM JUAL BELI EMAS ---
            if (cmd === 'beli_emas') {
                const kuantiti = parseInt(args[0]) || 1;
                const hargaSemasa = 5000;
                const totalBayaran = hargaSemasa * kuantiti;

                if (user.wallet < totalBayaran) return sock.sendMessage(jid, { text: `❌ Duit poket tak cukup! Kos untuk ${kuantiti} Emas ialah RM ${totalBayaran.toLocaleString()}.` }, { quoted: m });
                
                user.wallet -= totalBayaran;
                user.crypto.gold = (user.crypto.gold || 0) + kuantiti;
                await db.saveUser(user);
                return sock.sendMessage(jid, { text: `🥇 Berjaya beli ${kuantiti} Jongkong Emas dengan harga RM ${totalBayaran.toLocaleString()}!` }, { quoted: m });
            }

            if (cmd === 'jual_emas') {
                const kuantiti = parseInt(args[0]) || 1;
                const hargaJual = 4500;
                const totalDapat = hargaJual * kuantiti;

                if ((user.crypto.gold || 0) < kuantiti) return sock.sendMessage(jid, { text: `❌ Jongkong emas tak cukup! Awak cuma ada ${user.crypto.gold || 0} Emas.` }, { quoted: m });

                user.crypto.gold -= kuantiti;
                user.wallet += totalDapat;
                await db.saveUser(user);
                return sock.sendMessage(jid, { text: `💸 Berjaya jual ${kuantiti} Jongkong Emas! Awak terima RM ${totalDapat.toLocaleString()}.` }, { quoted: m });
            }

            // --- SISTEM JUAL BELI BITCOIN ---
            if (cmd === 'beli_btc') {
                const kuantiti = parseInt(args[0]) || 1;
                const hargaSemasa = 250000;
                const totalBayaran = hargaSemasa * kuantiti;

                if (user.wallet < totalBayaran) return sock.sendMessage(jid, { text: `❌ Duit poket tak cukup! Kos untuk ${kuantiti} BTC ialah RM ${totalBayaran.toLocaleString()}.` }, { quoted: m });
                
                user.wallet -= totalBayaran;
                user.crypto.btc = (user.crypto.btc || 0) + kuantiti;
                await db.saveUser(user);
                return sock.sendMessage(jid, { text: `🪙 Berjaya borong ${kuantiti} BTC dengan harga RM ${totalBayaran.toLocaleString()}! Bawa bersabar tunggu bullrun.` }, { quoted: m });
            }

            if (cmd === 'jual_btc') {
                const kuantiti = parseInt(args[0]) || 1;
                
                if ((user.crypto.btc || 0) < kuantiti) return sock.sendMessage(jid, { text: `❌ BTC tak cukup! Awak cuma ada ${user.crypto.btc || 0} BTC.` }, { quoted: m });

                // Harga BTC rawak antara RM 150,000 (Rugi Besar) hingga RM 350,000 (Untung Besar)
                const hargaMarket = Math.floor(Math.random() * (350000 - 150000 + 1)) + 150000;
                const totalDapat = hargaMarket * kuantiti;
                
                const statusUntung = hargaMarket > 250000 ? '📈 *PROFIT!*' : '📉 *RUGI!*';

                user.crypto.btc -= kuantiti;
                user.wallet += totalDapat;
                await db.saveUser(user);
                
                return sock.sendMessage(jid, { text: `📊 *PASARAN DITUTUP*\n\n🪙 BTC Dijual: ${kuantiti}\n🏷️ Harga Semasa: RM ${hargaMarket.toLocaleString()} / BTC\n${statusUntung}\n\n💸 Hasil Jualan: RM ${totalDapat.toLocaleString()} dimasukkan ke poket.` }, { quoted: m });
            }

        } catch (err) {
            console.error("Eco Error:", err);
        }
    }
};
