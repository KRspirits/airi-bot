import { adaKenderaan } from '../lib/kenderaan.js';
// =========================================================================
// 🎵 1. PANGKALAN DATA LAGU TRENDING & SAMBUNG LIRIK
// =========================================================================
export const SONG_DATABASE = [
    {
        id: 1,
        artist: "Ryan.B",
        title: "No Reason",
        theme: "Lagu melodi Cina tular tentang perasaan rindu dan cinta yang ikhlas tanpa perlukan alasan rumit.",
        lines: "You know that I love you, so why you gotta hurt me like this...",
        answerKeyword: "no reason",
        correctLine: "I got no reason to love you",
        reward: 4500
    },
    {
        id: 2,
        artist: "BLACKPINK",
        title: "DDU-DU DDU-DU",
        theme: "Kisah tentang keyakinan diri yang tinggi, karisma memukau, dan tidak mudah dipijak oleh sesiapa.",
        lines: "Chakhan eolgure geureoji mothan taedo...",
        answerKeyword: "ganyeorin",
        correctLine: "Ganyeorin mommae sok garyeojin volume",
        reward: 4000
    },
    {
        id: 3,
        artist: "BTS",
        title: "Dynamite",
        theme: "Lagu disko-pop bertenaga tinggi untuk membakar semangat dan menyinari malam yang kelam.",
        lines: "'Cause I, I, I'm in the stars tonight...",
        answerKeyword: "spark",
        correctLine: "So watch me bring the fire and set the night alight",
        reward: 4000
    },
    {
        id: 4,
        artist: "Alan Walker",
        title: "Faded",
        theme: "Perasaan hilang arah dan kekosongan mencari seseorang di tempat yang tidak pasti.",
        lines: "You were the shadow to my light, did you feel us?...",
        answerKeyword: "start",
        correctLine: "Another start, you fade away",
        reward: 4200
    },
    {
        id: 5,
        artist: "Justin Bieber",
        title: "Ghost",
        theme: "Kisah melepaskan orang tersayang dan belajar hidup tenang bersama memori mereka.",
        lines: "I miss the pieces of the man that you were...",
        answerKeyword: "ghost",
        correctLine: "If I can't be close to you, I'll settle for the ghost of you",
        reward: 4000
    },
    {
        id: 6,
        artist: "Da Zhuang",
        title: "Wo Men Bu Yi Yang",
        theme: "Lagu klasik Cina tular tentang persahabatan sejati yang menempuh jalan berliku dan takdir berbeza.",
        lines: "Zhe duo nian de peng you, feng yu guo hou...",
        answerKeyword: "bu yi yang",
        correctLine: "Wo men bu yi yang, mei ge ren dou you bu tong de jing yu",
        reward: 4500
    },
    {
        id: 7,
        artist: "BLACKPINK",
        title: "Kill This Love",
        theme: "Keberanian menamatkan hubungan toksik yang menyakitkan sebelum diri sendiri musnah.",
        lines: "Yeah, yeah, yeah, yeah, yeah, rum, pum, pum, pum, pum, pum, pum...",
        answerKeyword: "kill this love",
        correctLine: "Let's kill this love",
        reward: 3800
    },
    {
        id: 8,
        artist: "Alan Walker",
        title: "Alone",
        theme: "Semangat perpaduan dan sokongan bersama di mana kita tidak pernah bersendirian meredah cabaran.",
        lines: "I know I'm not alone, I know I'm not alone...",
        answerKeyword: "unconscious",
        correctLine: "Unconscious mind, I'm wide awake",
        reward: 4200
    },
    {
        id: 9,
        artist: "Justin Bieber",
        title: "Peaches",
        theme: "Kisah cinta santai dan apresiasi pasangan berlatarkan suasana tenang Pantai Barat.",
        lines: "I got my peaches out in Georgia...",
        answerKeyword: "california",
        correctLine: "I get my weed from California",
        reward: 4000
    },
    {
        id: 10,
        artist: "BTS",
        title: "Butter",
        theme: "Keyakinan dan daya penarik yang lancar tanpa cacat cela memikat hati pendengar.",
        lines: "Smooth like butter, like a criminal undercover...",
        answerKeyword: "trouble",
        correctLine: "Gon' pop like trouble breaking into your heart like that",
        reward: 4000
    }
];

// Status sesi kuiz lagu semasa
let activeSongQuiz = {
    active: false,
    song: null,
    chatId: null,
    timer: null
};

// =========================================================================
// 🚗 2. PANGKALAN DATA PLAT NOMBOR VIP JPJ
// =========================================================================
export const VIP_PLATES = [
    { plate: "V 1", price: 150000, desc: "Plat keramat nombor tunggal Ibu Kota!" },
    { plate: "AIRI 77", price: 80000, desc: "Plat khas edisi maskot kesayangan ramai." },
    { plate: "BOSS 1", price: 250000, desc: "Plat megah simbol kuasa pengasas empayar." },
    { plate: "MALAYSIA 999", price: 120000, desc: "Plat patriotik bertaraf legenda jalan raya." },
    { plate: "VIP 888", price: 95000, desc: "Nombor tuah feng shui bertaraf konglomerat." }
];

export default {
    name: 'teka_lagu',
    alias: ['jawab', 'lelong_plat', 'beli_plat'],
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const senderJid = m.key.participant || jid;
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const args = teks.trim().split(' ').slice(1);
        const cmd = teks.slice(1).trim().split(' ')[0].toLowerCase();

        // -------------------------------------------------------------
        // A. KUIZ SAMBUNG LIRIK (.teka_lagu)
        // -------------------------------------------------------------
        if (cmd === 'teka_lagu') {
            if (activeSongQuiz.active) {
                return sock.sendMessage(jid, { 
                    text: '⚠️ Ada kuiz lagu yang masih berjalan! Selesaikan yang itu dulu ya! 🌸' 
                }, { quoted: m });
            }

            const chosen = SONG_DATABASE[Math.floor(Math.random() * SONG_DATABASE.length)];
            activeSongQuiz = {
                active: true,
                song: chosen,
                chatId: jid,
                timer: null
            };

            const teksKuiz = `
┌───「 🎤 𝗔𝗜𝗥𝗜 𝗞𝗨𝗜𝗭 𝗠𝗨𝗭𝗜𝗞: 𝗦𝗔𝗠𝗕𝗨𝗡𝗚 𝗟𝗜𝗥𝗜𝗞! 」
├ 👤 𝗔𝗿𝘁𝗶𝘀  : ${chosen.artist}
├ 📝 𝗧𝗲𝗺𝗮   : ${chosen.theme}
├───────────────────────────
├ 🎶 *Bait Awal Lirik:*
│   _"${chosen.lines}"_
├───────────────────────────
├ ❓ *Tugasan :* Sambung baris lirik seterusnya!
├ 💰 *Hadiah  :* +RM ${chosen.reward.toLocaleString()} Tunai
├ ⏳ *Masa    :* 45 Saat
└───────────────────────────
👉 Taip segera: \`.jawab [sambungan lirik]\`!`;

            await sock.sendMessage(jid, { text: teksKuiz });

            activeSongQuiz.timer = setTimeout(async () => {
                if (activeSongQuiz.active && activeSongQuiz.chatId === jid) {
                    activeSongQuiz.active = false;
                    await sock.sendMessage(jid, {
                        text: `⌛ *MASA MENJAWAB TAMAT!*\n\nTiada siapa berjaya menyambung lirik tersebut.\nJawapan sambungannya ialah: *"${chosen.correctLine}"*.\n\nAwak boleh membuat carian di Google untuk menikmati keseluruhan bait lirik berlesen rasmi lagu ini! Hehe~ 🤍`
                    });
                }
            }, 45000);

            return;
        }

        // -------------------------------------------------------------
        // B. JAWAB SAMBUNGAN LIRIK (.jawab [lirik])
        // -------------------------------------------------------------
        if (cmd === 'jawab') {
            if (!activeSongQuiz.active || activeSongQuiz.chatId !== jid) {
                return sock.sendMessage(jid, { text: '❌ Tiada sesi kuiz lagu yang aktif sekarang! Taip `.teka_lagu` untuk mula.' }, { quoted: m });
            }

            const cubaan = args.join(' ').trim().toLowerCase();
            if (!cubaan) {
                return sock.sendMessage(jid, { text: '❌ Taip lirik sambungannya sekali! Contoh: `.jawab [sambungan lirik]`' }, { quoted: m });
            }

            const current = activeSongQuiz.song;
            const isCorrect = cubaan.includes(current.answerKeyword.toLowerCase());

            if (isCorrect) {
                clearTimeout(activeSongQuiz.timer);
                activeSongQuiz.active = false;

                user.wallet += current.reward;
                await db.saveUser(user);

                return sock.sendMessage(jid, {
                    text: `
🎉 *TAHNIAH! SAMBUNGAN LIRIK TEPAT!* 🌸
@${senderJid.split('@')[0]} berjaya menyambung lirik lagu *${current.title}* oleh *${current.artist}*!

✨ Lirik penuh baris itu: _"${current.correctLine}"_
💵 Ganjaran Tunai: *+RM ${current.reward.toLocaleString()}* telah dimasukkan ke poket!

💬 𝗔𝗶𝗿𝗶: "Power gila telinga muzik awak! Hafal betul lirik lagu trending ni~ 😋🤍"`,
                    mentions: [senderJid]
                });
            } else {
                return sock.sendMessage(jid, {
                    text: `Alahai, sambungan lirik tu kurang tepat sikit~ Cuba dengar balik ritma lagu tu! 🥺🎶`
                }, { quoted: m });
            }
        }

        // -------------------------------------------------------------
        // C. SENARAI PLAT NOMBOR VIP JPJ (.lelong_plat)
        // -------------------------------------------------------------
        if (cmd === 'lelong_plat') {
            let uiPlat = `┌───「 🚘 𝗣𝗔𝗦𝗔𝗥𝗔𝗡 𝗣𝗟𝗔𝗧 𝗩𝗜𝗣 𝗝𝗣𝗝 𝗘𝗞𝗦𝗞𝗟𝗨𝗦𝗜𝗙 」\n├───────────────────────────\n`;
            VIP_PLATES.forEach((p, idx) => {
                uiPlat += `├ [${idx + 1}] *${p.plate}*\n│   💵 Harga: RM ${p.price.toLocaleString()}\n│   📝 Nota : ${p.desc}\n`;
            });
            uiPlat += `└───────────────────────────\nBeli plat idaman untuk jentera anda: \`.beli_plat [nombor]\``;

            return sock.sendMessage(jid, { text: uiPlat }, { quoted: m });
        }

        // -------------------------------------------------------------
        // D. BELI & PASANG PLAT VIP (.beli_plat [nombor])
        // -------------------------------------------------------------
        if (cmd === 'beli_plat') {
            const noPilihan = parseInt(args[0]);
            const platDipilih = VIP_PLATES[noPilihan - 1];

            if (!platDipilih) {
                return sock.sendMessage(jid, { text: '❌ Nombor plat tidak sah! Semak senarai melalui `.lelong_plat`.' }, { quoted: m });
            }

            if (user.wallet < platDipilih.price) {
                return sock.sendMessage(jid, { 
                    text: `❌ Tunai poket tidak mencukupi! Plat bertaraf elit ini berharga RM ${platDipilih.price.toLocaleString()}` 
                }, { quoted: m });
            }

            user.wallet -= platDipilih.price;
            if (!adaKenderaan(user)) {
                user.vehicle = { name: 'Motosikal Asas', speed: 40, tier: 'F' };
            }
            user.vehicle.plate = platDipilih.plate;
            await db.saveUser(user);

            return sock.sendMessage(jid, {
                text: `
┌───「 👑 𝗣𝗘𝗡𝗗𝗔𝗙𝗧𝗔𝗥𝗔𝗡 𝗣𝗟𝗔𝗧 𝗩𝗜𝗣 𝗦𝗘𝗟𝗘𝗦𝗔𝗜 」
├ 🏷️ 𝗡𝗼. 𝗣𝗹𝗮𝘁 : [ ${platDipilih.plate} ]
├ 🚗 𝗝𝗲𝗻𝘁𝗲𝗿𝗮 : ${user.vehicle.name}
├ 💵 𝗕𝗮𝘆𝗮𝗿𝗮𝗻 : RM ${platDipilih.price.toLocaleString()}
└───────────────────────────
Plat VIP kini rasmi dipasang pada jentera anda dan terpapar megah di \`.myid\`!
💬 𝗔𝗶𝗿𝗶: "Fuhhh melaram habis jentera kat highway lepas ni, ada gaya orang kaya!" ✨`
            }, { quoted: m });
        }
    }
};
