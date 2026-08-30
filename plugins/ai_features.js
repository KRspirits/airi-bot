import { config } from '../config.js';
import { askAiri, judgeCourtAppeal, appraiseItem, verifyPantun } from '../lib/geminiAI.js';

export default {
    name: 'airi_mega',
    alias: ['airi', 'roast', 'puji', 'rayu', 'taksir', 'pantun_ai', 'buletin_cyber', 'misi'],
    execute: async ({ sock, m, user, db }) => {
        try {
            const jid = m.key.remoteJid;
            const senderJid = m.key.participant || jid;
            const cleanSender = String(senderJid).replace(/[^0-9]/g, '');
            const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
            const args = teks.trim().split(' ').slice(1);
            const cmd = teks.slice(1).trim().split(' ')[0].toLowerCase();
            const botJid = (sock.user?.id?.split(':')[0] || '') + '@s.whatsapp.net';

            // Kenal pasti adakah pengirim itu Bos Amar
            const ownersList = Array.isArray(config.ownerNumbers) ? config.ownerNumbers : (config.owner ? [config.owner] : []);
            const isAmar = ownersList.some(ownerNum => cleanSender.includes(String(ownerNum).replace(/[^0-9]/g, '')));

            // Persona Dinamik Airi
            const personaAiri = `Nama kau Airi. Kau bot WhatsApp perempuan yang comel, sarkastik, dan manja. 
Pencipta dan Tuan Mutlak kau ialah Bos Amar. 
Sekarang kau sedang berbual dengan ${isAmar ? 'Bos Amar (Tuan kau! Layan dengan sangat patuh, panggil dia Bos Amar atau Sayang)' : 'pemain biasa bernama ' + (m.pushName || 'Warga') + ' (Layan kasar sikit, perli, dan guna bahasa Melayu pasar WhatsApp)'}.`;

            // 1. CHAT NORMAL (.airi)
            if (cmd === 'airi') {
                const soalan = args.join(' ').trim();
                if (!soalan) return sock.sendMessage(jid, { text: `Hehe ya ${isAmar ? 'Bos Amar' : 'awak'}? Nak Airi tolong apa tu? Taip \`.airi [soalan]\` tau~ 🌸✨` }, { quoted: m });
                
                // Hantar persona bersama soalan ke helper sedia ada
                const konteks = `${personaAiri}\n\nSoalan pemain: "${soalan}"`;
                const jawapan = await askAiri(konteks, "Abaikan format tambahan, balas terus sebagai Airi.");
                return sock.sendMessage(jid, { text: `💬 𝗔𝗶𝗿𝗶: ${jawapan}` }, { quoted: m });
            }

            // 2. ROAST & PUJI (.roast / .puji)
            if (cmd === 'roast' || cmd === 'puji') {
                let targetJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
                if (!targetJid) return sock.sendMessage(jid, { text: `❌ Alololo nak ${cmd} siapa tu? Tag la kawan dulu! Contoh: \`.${cmd} @user\`` }, { quoted: m });

                const cleanTarget = String(targetJid).replace(/[^0-9]/g, '');
                const isTargetAmar = ownersList.some(ownerNum => cleanTarget.includes(String(ownerNum).replace(/[^0-9]/g, '')));

                if (targetJid.includes(botJid.replace(/[^0-9]/g, ''))) {
                    return sock.sendMessage(jid, { text: cmd === 'roast' ? `Ehh berani nak suruh Airi bahan diri sendiri ya? 😋🌸` : `Aww terima kasih puji Airi! ✨🤍` }, { quoted: m });
                }
                
                // LOGIK PERTAHANAN BOS AMAR
                if (cmd === 'roast' && isTargetAmar && !isAmar) {
                    return sock.sendMessage(jid, { text: `😡 Berani kau suruh Airi kutuk Bos Amar?! Kau tu dah la miskin, pergi main jauh-jauh! Hormat sikit Tuan aku!` }, { quoted: m });
                }

                if (targetJid === senderJid) {
                    return sock.sendMessage(jid, { text: cmd === 'roast' ? `Kenapa nak suruh Airi bahan awak sendiri? Kesiannya... 🥺💨` : `Syok sendiri nampak! Hehe~ 🌸` }, { quoted: m });
                }

                const targetUser = await db.getUser(targetJid);
                const profilMangsa = `Nama: ${targetUser.name || 'Warga'}\nDuit Poket: RM ${targetUser.wallet || 0}\nJentera: ${targetUser.vehicle?.name || 'Jalan Kaki'}\nKerap Masuk Lokap: ${targetUser.stats?.times_jailed || 0} kali`;
                
                let promptKhusus = cmd === 'roast' 
                    ? `${personaAiri}\nTugas kau membahan pemain ini dalam 2 baris ayat padu berdasarkan profilnya: ${profilMangsa}. Jangan puji langsung!`
                    : `${personaAiri}\nPuji pemain ini melambung tinggi dengan gaya manja dalam 2 baris ayat berdasarkan profilnya: ${profilMangsa}.`;

                if (cmd === 'roast' && isTargetAmar && isAmar) {
                    promptKhusus = `Kau terpaksa 'roast' Bos Amar (tuan kau) sebab dia sendiri yang minta. Buat secara manja-manja dan tak berani sangat.`;
                }

                const responAI = await askAiri(promptKhusus);
                return sock.sendMessage(jid, { text: `✨ *AIRI ${cmd.toUpperCase()} CORNER* ✨\n\n${responAI}\n\n👉 Sasaran: @${targetJid.split('@')[0]}`, mentions: [targetJid] }, { quoted: m });
            }

            // 3. DUNGEON MASTER - RPG INTERAKTIF (.misi)
            if (cmd === 'misi') {
                const tindakan = args.join(' ');
                if (!tindakan) {
                    return sock.sendMessage(jid, { text: `🎲 *MISI BERMULA*\nKau terperangkap dalam bank dengan PDRM dah kepung luar. Bawa lari jongkong emas atau cari tebusan? Taip: \`.misi [tindakan kau]\`` }, { quoted: m });
                }
                
                const dmPrompt = `Pemain membuat tindakan RPG: "${tindakan}". 
Sebagai Dungeon Master (dengan gaya bahasa Airi yang comel/sarkastik), jana keputusan rawak sama ada dia berjaya atau gagal. 
Balas 2 ayat dramatik. Di hujung teks, TULIS SAMA ADA [MENANG] atau [KALAH]. Wajib ada salah satu tag ini.`;
                
                const keputusan = await askAiri(dmPrompt);
                
                if (keputusan.includes('[MENANG]')) {
                    const untung = Math.floor(Math.random() * 40000) + 10000;
                    user.wallet = (user.wallet || 0) + untung;
                    await db.saveUser(user);
                    return sock.sendMessage(jid, { text: `🎭 ${keputusan.replace('[MENANG]', '').trim()}\n\n💰 Tahniah! Kau dapat duit rompakan RM ${untung.toLocaleString()}!` }, { quoted: m });
                } else {
                    user.jail = { status: true, release_at: Date.now() + 120000, reason: "Tumpas Misi RPG" };
                    await db.saveUser(user);
                    return sock.sendMessage(jid, { text: `🎭 ${keputusan.replace('[KALAH]', '').trim()}\n\n🚨 KANTOI! Kau diseret ke lokap selama 120 saat!` }, { quoted: m });
                }
            }

            // 4. RAYUAN MAHKAMAH (.rayu)
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

            // 5. TAKSIR BARANG TEKS (.taksir)
            if (cmd === 'taksir') {
                const barang = args.join(' ').trim();
                if (!barang) return sock.sendMessage(jid, { text: '❌ Tulis nama barang nak ditaksir!' }, { quoted: m });
                const hasil = await appraiseItem(barang);
                user.wallet += hasil.harga;
                await db.saveUser(user);
                return sock.sendMessage(jid, { text: `┌───「 🏪 𝗣𝗔𝗝𝗔𝗞 𝗚𝗔𝗗𝗔𝗜 𝗔𝗜𝗥𝗜 𝗖𝗢𝗠𝗘𝗟 」\n├ 📦 𝗕𝗮𝗿𝗮𝗻𝗴 : ${barang}\n├ 📜 𝗦𝗲𝗷𝗮𝗿𝗮𝗵 : ${hasil.cerita}\n├ 💵 𝗧𝗮𝗸𝘀𝗶𝗿𝗮𝗻: +RM ${hasil.harga.toLocaleString()}\n└───────────────────────────\n💬 𝗔𝗶𝗿𝗶: "Airi suka barang ni tau! 🤍"` }, { quoted: m });
            }

            // 6. PANTUN AI (.pantun_ai)
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

            // 7. BULETIN CYBER (.buletin_cyber)
            if (cmd === 'buletin_cyber') {
                const allUsers = await db.getAllUsers();
                const topKaya = allUsers.sort((a, b) => (b.wallet + b.bank) - (a.wallet + a.bank))[0]?.name || 'Tiada';
                const banduan = allUsers.filter(u => u.jail?.status).map(u => u.name).slice(0, 2).join(', ') || 'Semua warga baik-baik';
                const promptBuletin = `${personaAiri}\nBuat siaran berita ringkas kelakar. Paling kaya: ${topKaya}. Dalam lokap: ${banduan}. Gaya wartawan cilik ceria.`;
                const teksBerita = await askAiri(promptBuletin);
                return sock.sendMessage(jid, { text: `📰 *BULETIN CYBER AIRI'S CORNER* 📰\n───────────────────────────\n${teksBerita}\n───────────────────────────\n🎙️ _Wartawan Comel Airi Melaporkan!_ ✨` }, { quoted: m });
            }

        } catch (err) {
            console.error("AI Features Error:", err);
        }
    }
};
