import { sasaranJid } from '../lib/target.js';
import { resolveJid } from '../lib/lidmap.js';
export default {
    name: 'ikat_jamin',
    alias: ['undi_hukum', 'bicarakan'],
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const senderId = m.key.participant || jid;
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const args = teks.trim().split(' ').slice(1);
        const cmd = teks.slice(1).trim().split(' ')[0].toLowerCase();
        const targetJid = await sasaranJid(sock, m);

        // 1. IKAT JAMIN KAWAN DARI LOKAP (.ikat_jamin @user)
        if (cmd === 'ikat_jamin') {
            if (!targetJid) return sock.sendMessage(jid, { text: '❌ Tag rakan yang merengkok dalam lokap! Contoh: `.ikat_jamin @user`' }, { quoted: m });

            const banduan = await db.getUser(targetJid);
            if (!banduan.jail?.status || Date.now() >= banduan.jail.release_at) {
                return sock.sendMessage(jid, { text: '❌ Rakan awak dah bebas, tak payah nak buang duit jamin!' }, { quoted: m });
            }

            const yuranJamin = 1000;
            if (user.wallet < yuranJamin) {
                return sock.sendMessage(jid, { text: `❌ Duit poket awak tak cukup RM ${yuranJamin.toLocaleString()} untuk bayar wang ikat jamin mahkamah!` }, { quoted: m });
            }

            user.wallet -= yuranJamin;
            banduan.jail.status = false;
            banduan.jail.release_at = 0;

            await db.saveUser(user);
            await db.saveUser(banduan);

            return sock.sendMessage(jid, {
                text: `
┌───「 ⚖️ 𝗠𝗔𝗛𝗞𝗔𝗠𝗔𝗛 𝗧𝗜𝗡𝗚𝗚𝗜: 𝗜𝗞𝗔𝗧 𝗝𝗔𝗠𝗜𝗡 」
├ 🕊️ 𝗕𝗮𝗻𝗱𝘂𝗮𝗻 : @${targetJid.split('@')[0]}
├ 🤝 𝗣𝗲𝗻𝗷𝗮𝗺𝗶𝗻 : @${senderId.split('@')[0]}
├ 💵 𝗨𝗽𝗮𝗵     : RM ${yuranJamin.toLocaleString()} Diterima
└───────────────────────────
Pintu sel dibuka serta-merta! Tanda setia kawan sejati.
💬 𝗔𝗶𝗿𝗶: "Untung ada kawan kaya tolong bayar jamin, jangan lepas ni buat hal lagi!"`,
                mentions: [targetJid, senderId]
            });
        }

        // 2. UNDI HUKUM RAKYAT (.undi_hukum @user [bebas/tambah])
        if (cmd === 'undi_hukum' || cmd === 'bicarakan') {
            if (!targetJid) return sock.sendMessage(jid, { text: '❌ Tag sasaran banduan: `.undi_hukum @user [bebas/tambah]`' }, { quoted: m });

            const undian = args[1]?.toLowerCase();
            if (!['bebas', 'tambah'].includes(undian)) {
                return sock.sendMessage(jid, { text: '❌ Pilihan undi tidak sah! Taip `bebas` atau `tambah`.' }, { quoted: m });
            }

            const banduan = await db.getUser(targetJid);
            if (!banduan.jail?.status || Date.now() >= banduan.jail.release_at) {
                return sock.sendMessage(jid, { text: '❌ Sasaran tiada dalam lokap!' }, { quoted: m });
            }

            if (!banduan.jail.voters) banduan.jail.voters = [];
            if (banduan.jail.voters.includes(senderId)) {
                return sock.sendMessage(jid, { text: '⚠️ Awak dah buang undi untuk perbicaraan banduan ini!' }, { quoted: m });
            }

            banduan.jail.voters.push(senderId);

            if (undian === 'bebas') {
                banduan.jail.vote_free = (banduan.jail.vote_free || 0) + 1;
            } else {
                banduan.jail.vote_jail = (banduan.jail.vote_jail || 0) + 1;
            }

            // Jika undi bebas capai 3 orang, banduan bebas
            if (banduan.jail.vote_free >= 3) {
                banduan.jail.status = false;
                banduan.jail.release_at = 0;
                banduan.jail.voters = [];
                await db.saveUser(banduan);

                return sock.sendMessage(jid, {
                    text: `⚖️ *PENGAMPUNAN JURI RAKYAT!*\n@${targetJid.split('@')[0]} dibebaskan atas sokongan majoriti ahli grup!`,
                    mentions: [targetJid]
                });
            }

            // Jika undi tambah capai 3 orang, tambah 3 minit lokap
            if (banduan.jail.vote_jail >= 3) {
                banduan.jail.release_at += (3 * 60 * 1000);
                banduan.jail.vote_jail = 0;
                await db.saveUser(banduan);

                return sock.sendMessage(jid, {
                    text: `⚖️ *HUKUMAN TAMBAHAN!*\nJuri grup bersetuju menambah *3 Minit Lagi* masa lokap ke atas @${targetJid.split('@')[0]}!`,
                    mentions: [targetJid]
                });
            }

            await db.saveUser(banduan);

            return sock.sendMessage(jid, {
                text: `🗳️ *UNDIAN JURI MAHKAMAH DIREKOD!*\nBanduan: @${targetJid.split('@')[0]}\n• Sokong Bebas: ${banduan.jail.vote_free}/3\n• Tambah Hukuman: ${banduan.jail.vote_jail}/3`,
                mentions: [targetJid]
            });
        }
    }
};
