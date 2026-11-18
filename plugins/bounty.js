import { resolveJid } from '../lib/lidmap.js';
import { pemainGroup } from '../lib/groupusers.js';
export default {
    name: 'bounty',
    alias: ['list_bounty', 'buru', 'wanted'],
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const commandUsed = teks.slice(1).trim().split(' ')[0].toLowerCase();
        const args = teks.trim().split(' ').slice(1);
        const targetJid = resolveJid(m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]);

        // 1. LIHAT SENARAI PALING DIKEHENDAKI (.list_bounty)
        if (commandUsed === 'list_bounty' || commandUsed === 'wanted') {
            const allUsers = await pemainGroup(sock, m.key.remoteJid, await db.getAllUsers());
            // Tapis mereka yang ada nilai bounty melebihi 0
            const wantedList = allUsers
                .filter(u => u.stats?.bounty > 0)
                .sort((a, b) => (b.stats?.bounty || 0) - (a.stats?.bounty || 0))
                .slice(0, 5);

            if (wantedList.length === 0) {
                return sock.sendMessage(jid, { 
                    text: '📜 Papan kenyataan kosong! Tiada sesiapa yang ada harga buruan buat masa ni.' 
                }, { quoted: m });
            }

            let teksBounty = `
┌───「 ☠️ 𝗣𝗔𝗣𝗔𝗡 𝗞𝗘𝗣𝗔𝗟𝗔 𝗕𝗨𝗥𝗢𝗡𝗔𝗡 」
│ _Tumpaskan sasaran untuk kutip hasil habuan._
├───────────────────────────\n`;

            wantedList.forEach((w, index) => {
                teksBounty += `├ ${index + 1}. @${w.id.split('@')[0]}\n│   💰 Habuan: RM ${w.stats.bounty.toLocaleString()}\n`;
            });

            teksBounty += `└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "Kaki-kaki hutang dan penjenayah tegar tersusun rapi kat atas tu."`;

            return sock.sendMessage(jid, { 
                text: teksBounty, 
                mentions: wantedList.map(u => u.id) 
            }, { quoted: m });
        }

        // 2. LETAK HARGA BURUAN (.bounty @user [jumlah])
        if (!targetJid || !args[1]) {
            return sock.sendMessage(jid, { 
                text: '❌ Format salah! Cara guna: `.bounty @user [jumlah]`\nContoh: `.bounty @tag 5000`' 
            }, { quoted: m });
        }

        const senderJid = m.key.participant || jid;
        if (targetJid === senderJid) {
            return sock.sendMessage(jid, { text: '❌ Nak letak harga buruan atas kepala sendiri buat apa weh?!' }, { quoted: m });
        }

        const jumlahBounty = parseInt(args[1]);
        if (isNaN(jumlahBounty) || jumlahBounty < 1000) {
            return sock.sendMessage(jid, { text: '❌ Minimum habuan buruan adalah RM 1,000!' }, { quoted: m });
        }

        if (user.wallet < jumlahBounty) {
            return sock.sendMessage(jid, { 
                text: `❌ Duit poket awak tak cukup bayar upah buruan RM ${jumlahBounty.toLocaleString()}!` 
            }, { quoted: m });
        }

        const targetUser = await db.getUser(targetJid);

        user.wallet -= jumlahBounty;
        targetUser.stats.bounty = (targetUser.stats.bounty || 0) + jumlahBounty;

        await db.saveUser(user);
        await db.saveUser(targetUser);

        const responBountySet = `
┌───「 🎯 𝗛𝗔𝗕𝗨𝗔𝗡 𝗕𝗨𝗥𝗨𝗔𝗡 𝗗𝗜𝗟𝗘𝗧𝗔𝗞 」
├ 👤 𝗦𝗮𝘀𝗮𝗿𝗮𝗻 : @${targetJid.split('@')[0]}
├ 💵 𝗧𝗮𝗺𝗯𝗮𝗵𝗮𝗻: +RM ${jumlahBounty.toLocaleString()}
├ 💀 𝗧𝗼𝘁𝗮𝗹 𝗛𝗮𝗯𝘂𝗮𝗻: RM ${targetUser.stats.bounty.toLocaleString()}
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "Uish ada orang kena target! Jaga-jaga jalan malam, silap haribulan kena tapau."`;

        return sock.sendMessage(jid, { 
            text: responBountySet, 
            mentions: [targetJid] 
        }, { quoted: m });
    }
};
