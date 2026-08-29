import { askAiri, judgeCourtAppeal, appraiseItem, verifyPantun } from '../lib/groqAI.js';

export default {
    name: 'airi',
    alias: ['roast', 'puji', 'rayu', 'taksir', 'pantun_ai', 'buletin_cyber'],
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const senderJid = m.key.participant || jid;
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const args = teks.trim().split(' ').slice(1);
        const cmd = teks.slice(1).trim().split(' ')[0].toLowerCase();
        const botJid = (sock.user?.id?.split(':')[0] || '') + '@s.whatsapp.net';

        if (cmd === 'airi') {
            const soalan = args.join(' ').trim();
            if (!soalan) return sock.sendMessage(jid, { text: 'Hehe ya saya Airi comel! Awak nak borak apa tu? Taip `.airi [soalan]` tau~ 🌸✨' }, { quoted: m });
            try {
                const konteks = `Pemain bernama ${m.pushName || 'Warga'} sedang berbual dengan kau.`;
                const jawapan = await askAiri(soalan, konteks);
                return sock.sendMessage(jid, { text: `💬 𝗔𝗶𝗿𝗶: ${jawapan}` }, { quoted: m });
            } catch (err) {
                return sock.sendMessage(jid, { text: 'Alamak otak AI Airi tercekik air boba sekejap hehe~ 🥺🧋' }, { quoted: m });
            }
        }

        if (cmd === 'roast' || cmd === 'puji') {
            let targetJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant;
            if (!targetJid) return sock.sendMessage(jid, { text: `❌ Alololo nak ${cmd} siapa tu? Tag la kawan dulu! Contoh: \`.${cmd} @user\`` }, { quoted: m });

            if (targetJid.includes(botJid.replace(/[^0-9]/g, '')) || targetJid === botJid) {
                return sock.sendMessage(jid, { text: cmd === 'roast' ? `Ehh berani nak suruh Airi bahan diri sendiri ya? 😋🌸` : `Aww terima kasih puji Airi! ✨🤍` }, { quoted: m });
            }
            if (targetJid === senderJid) {
                return sock.sendMessage(jid, { text: cmd === 'roast' ? `Kenapa nak suruh Airi bahan awak sendiri? Kesiannya... 🥺💨` : `Syok sendiri nampak! Hehe~ 🌸` }, { quoted: m });
            }

            const targetUser = await db.getUser(targetJid);
            const profilMangsa = `Nama: ${targetUser.name || 'Warga'}\nDuit Poket: RM ${targetUser.wallet}\nJentera: ${targetUser.vehicle?.name || 'Jalan Kaki'}\nKerap Masuk Lokap: ${targetUser.stats?.times_jailed || 0} kali`;
            
            const promptKhusus = cmd === 'roast' 
                ? `Tugas kau membahan pemain bernama "${targetUser.name || 'Warga'}". Gaya comel, menyakat, santai KL. Jangan puji, bahan duit/jentera/lokap dia dalam 2 baris ayat padu! Profil: ${profilMangsa}`
                : `Puji pemain bernama "${targetUser.name || 'Warga'}" melambung tinggi. Gaya periang, comel, manja Malaysia dalam 2 baris ayat. Profil: ${profilMangsa}`;

            const responAI = await askAiri(promptKhusus);
            return sock.sendMessage(jid, { text: `✨ *AIRI ${cmd.toUpperCase()} CORNER* ✨\n\n${responAI}\n\n👉 Sasaran: @${targetJid.split('@')[0]}`, mentions: [targetJid] }, { quoted: m });
        }

        if (cmd === 'rayu') {
            if (!user.jail?.status || Date.now() >= user.jail.release_at) return sock.sendMessage(jid, { text: 'Hehe awak kan bebas! 🌸' }, { quoted: m });
            const alasan = args.join(' ').trim();
            if (!alasan) return sock.sendMessage(jid, { text: '❌ Berikan alasan rayuan! Contoh: `.rayu nak beli boba`' }, { quoted: m });

            const keputusan = await judgeCourtAppeal(user.name, alasan);
            if (keputusan.isLepas) {
                user.jail.status = false;
                user.jail.release_at = 0;
                await db.saveUser(user);
                return sock.sendMessage(jid, { text: `⚖️ *MAHKAMAH MAJISTRET AIRI*\nStatus: 🟢 *DIBEBASKAN!*\n\n💬 Hakim Airi: "${keputusan.ulasan}"\nYeay awak bebas! ✨` }, { quoted: m });
            } else {
                user.jail.release_at += (2 * 60 * 1000);
                await db.saveUser(user);
                return sock.sendMessage(jid, { text: `⚖️ *MAHKAMAH MAJISTRET AIRI*\nStatus: 🔴 *RAYUAN DITOLAK!*\n\n💬 Hakim Airi: "${keputusan.ulasan}"\nKena tambah 2 minit lagi! 😜🔒` }, { quoted: m });
            }
        }

        if (cmd === 'taksir') {
            const barang = args.join(' ').trim();
            if (!barang) return sock.sendMessage(jid, { text: '❌ Tulis nama barang nak ditaksir!' }, { quoted: m });
            const hasil = await appraiseItem(barang);
            user.wallet += hasil.harga;
            await db.saveUser(user);
            return sock.sendMessage(jid, { text: `┌───「 🏪 𝗣𝗔𝗝𝗔𝗞 𝗚𝗔𝗗𝗔𝗜 𝗔𝗜𝗥𝗜 𝗖𝗢𝗠𝗘𝗟 」\n├ 📦 𝗕𝗮𝗿𝗮𝗻𝗴 : ${barang}\n├ 📜 𝗦𝗲𝗷𝗮𝗿𝗮𝗵 : ${hasil.cerita}\n├ 💵 𝗧𝗮𝗸𝘀𝗶𝗿𝗮𝗻: +RM ${hasil.harga.toLocaleString()}\n└───────────────────────────\n💬 𝗔𝗶𝗿𝗶: "Airi suka barang ni tau! 🤍"` }, { quoted: m });
        }

        if (cmd === 'pantun_ai') {
            const pantunInput = args.join(' ').trim();
            if (!pantunInput) return sock.sendMessage(jid, { text: '❌ Masukkan pantun awak!' }, { quoted: m });
            const penilaian = await verifyPantun(pantunInput);
            if (penilaian.passed) {
                user.wallet += 3500;
                await db.saveUser(user);
                return sock.sendMessage(jid, { text: `🌸 *PANTUN DITERIMA!* 🌸\n💬 Airi: "${penilaian.ulasan}"\n🎁 Hadiah: *+RM 3,500* ✨` }, { quoted: m });
            } else {
                return sock.sendMessage(jid, { text: `🍂 *PANTUN KELAUT~* 🍂\n💬 Airi: "${penilaian.ulasan}"\nCuba lagi ya! 🥺` }, { quoted: m });
            }
        }

        if (cmd === 'buletin_cyber') {
            const allUsers = await db.getAllUsers();
            const topKaya = allUsers.sort((a, b) => (b.wallet + b.bank) - (a.wallet + a.bank))[0]?.name || 'Tiada';
            const banduan = allUsers.filter(u => u.jail?.status).map(u => u.name).slice(0, 2).join(', ') || 'Semua warga baik-baik';
            const promptBuletin = `Buat siaran berita ringkas kelakar. Paling kaya: ${topKaya}. Dalam lokap: ${banduan}. Gaya wartawan cilik ceria.`;
            const teksBerita = await askAiri(promptBuletin);
            return sock.sendMessage(jid, { text: `📰 *BULETIN CYBER AIRI'S CORNER* 📰\n───────────────────────────\n${teksBerita}\n───────────────────────────\n🎙️ _Wartawan Comel Airi Melaporkan!_ ✨` }, { quoted: m });
        }
    }
};
