import { askAiri, judgeCourtAppeal, appraiseItem, verifyPantun } from '../lib/groqAI.js';

export default {
    name: 'roast',
    alias: ['puji', 'rayu', 'taksir', 'pantun_ai', 'buletin_cyber'],
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const args = teks.trim().split(' ').slice(1);
        const cmd = teks.slice(1).trim().split(' ')[0].toLowerCase();
        const targetJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

        // 1. ROAST & PUJI @USER DINAMIK
        if (cmd === 'roast' || cmd === 'puji') {
            if (!targetJid) {
                return sock.sendMessage(jid, { text: `❌ Tag kawan yang kau nak ${cmd}! Contoh: \`.${cmd} @user\`` }, { quoted: m });
            }

            const targetUser = await db.getUser(targetJid);
            const statusTarget = `Nama: ${targetUser.name}, Baki Poket: RM ${targetUser.wallet}, Baki Bank: RM ${targetUser.bank}, Jentera: ${targetUser.vehicle?.name || 'Jalan Kaki'}, Pernah Lokap: ${targetUser.stats?.times_jailed || 0} kali.`;

            const prompt = cmd === 'roast'
                ? `Bahan manja dan menyakat kawan ni berdasarkan info dia: ${statusTarget}. Jangan kasar sangat, buat gaya comel tapi pedas menusuk kalbu!`
                : `Puji kawan ni melambung tinggi dengan nada comel, ceria dan manja berdasarkan info dia: ${statusTarget}!`;

            const responAI = await askAiri(prompt);

            return sock.sendMessage(jid, {
                text: `✨ *AIRI ${cmd.toUpperCase()} CORNER* ✨\n\n${responAI}\n\n👉 Sasaran: @${targetJid.split('@')[0]}`,
                mentions: [targetJid]
            }, { quoted: m });
        }

        // 2. RAYUAN MAHKAMAH HAKIM COMEL (.rayu [alasan])
        if (cmd === 'rayu') {
            if (!user.jail?.status || Date.now() >= user.jail.release_at) {
                return sock.sendMessage(jid, { text: 'Hehe awak kan bebas, tak ada kes mahkamah pun! 🌸' }, { quoted: m });
            }

            const alasan = args.join(' ').trim();
            if (!alasan) {
                return sock.sendMessage(jid, { text: '❌ Berikan alasan rayuan awak! Contoh: `.rayu saya nak pergi beli boba sekejap je`' }, { quoted: m });
            }

            const keputusan = await judgeCourtAppeal(user.name, alasan);

            if (keputusan.isLepas) {
                user.jail.status = false;
                user.jail.release_at = 0;
                await db.saveUser(user);

                return sock.sendMessage(jid, {
                    text: `⚖️ *MAHKAMAH MAJISTRET AIRI*\nStatus: 🟢 *DIBEBASKAN!*\n\n💬 Hakim Airi: "${keputusan.ulasan}"\n\nYeay awak dah bebas! Jangan buat salah lagi tau~ ✨`
                }, { quoted: m });
            } else {
                user.jail.release_at += (2 * 60 * 1000); // Denda tambah 2 minit
                await db.saveUser(user);

                return sock.sendMessage(jid, {
                    text: `⚖️ *MAHKAMAH MAJISTRET AIRI*\nStatus: 🔴 *RAYUAN DITOLAK!*\n\n💬 Hakim Airi: "${keputusan.ulasan}"\n\nPadan muka kena tambah 2 minit lagi dalam sel! 😜🔒`
                }, { quoted: m });
            }
        }

        // 3. TOKEY PAJAK GADAI COMEL (.taksir [barang])
        if (cmd === 'taksir') {
            const barang = args.join(' ').trim();
            if (!barang) {
                return sock.sendMessage(jid, { text: '❌ Tulis nama barang nak ditaksir! Contoh: `.taksir kasut buruk jumpa celah longkang`' }, { quoted: m });
            }

            const hasil = await appraiseItem(barang);
            user.wallet += hasil.harga;
            await db.saveUser(user);

            return sock.sendMessage(jid, {
                text: `
┌───「 🏪 𝗣𝗔𝗝𝗔𝗞 𝗚𝗔𝗗𝗔𝗜 𝗔𝗜𝗥𝗜 𝗖𝗢𝗠𝗘𝗟 」
├ 📦 𝗕𝗮𝗿𝗮𝗻𝗴 : ${barang}
├ 📜 𝗦𝗲𝗷𝗮𝗿𝗮𝗵 : ${hasil.cerita}
├ 💵 𝗧𝗮𝗸𝘀𝗶𝗿𝗮𝗻: +RM ${hasil.harga.toLocaleString()} (Tunai Masuk Poket!)
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "Airi suka barang ni, simpan elok-elok dalam muzium comel Airi tau! 🤍"`
            }, { quoted: m });
        }

        // 4. BALAS PANTUN TEKA RIMA (.pantun_ai [pantun])
        if (cmd === 'pantun_ai') {
            const pantunInput = args.join(' ').trim();
            if (!pantunInput) {
                return sock.sendMessage(jid, { text: '❌ Masukkan pantun awak! Contoh: `.pantun_ai dua tiga kucing berlari, mana nak sama si kucing belang`' }, { quoted: m });
            }

            const penilaian = await verifyPantun(pantunInput);

            if (penilaian.passed) {
                const hadiah = 3500;
                user.wallet += hadiah;
                await db.saveUser(user);

                return sock.sendMessage(jid, {
                    text: `🌸 *PANTUN DITERIMA! TAHNIAH!* 🌸\n\n💬 Airi: "${penilaian.ulasan}"\n🎁 Hadiah Sastera: *+RM ${hadiah.toLocaleString()}* masuk wallet awak! ✨`
                }, { quoted: m });
            } else {
                return sock.sendMessage(jid, {
                    text: `🍂 *ALAHAI PANTUN KELAUT~* 🍂\n\n💬 Airi: "${penilaian.ulasan}"\nCuba reka pantun yang ada rima comel lagi ya! 🥺`
                }, { quoted: m });
            }
        }

        // 5. BULETIN SIBER HARIAN GRUP (.buletin_cyber)
        if (cmd === 'buletin_cyber') {
            const allUsers = await db.getAllUsers();
            const topKaya = allUsers.sort((a, b) => (b.wallet + b.bank) - (a.wallet + a.bank))[0]?.name || 'Tiada';
            const banduan = allUsers.filter(u => u.jail?.status).map(u => u.name).slice(0, 2).join(', ') || 'Semua warga baik-baik';

            const promptBuletin = `Buat satu siaran berita ringkas tv edisi kelakar dan comel.
Data terkini:
- Orang paling kaya: ${topKaya}
- Orang tengah merengkok dalam lokap: ${banduan}
Gaya berita bersahaja macam wartawan cilik yang ceria dan menyakat! 2 perenggan pendek.`;

            const teksBerita = await askAiri(promptBuletin);

            return sock.sendMessage(jid, {
                text: `📰 *BULETIN CYBER AIRI'S CORNER* 📰\n───────────────────────────\n${teksBerita}\n───────────────────────────\n🎙️ _Wartawan Comel Airi Melaporkan Dari Lokasi Kejadian!_ ✨`
            }, { quoted: m });
        }
    }
};
