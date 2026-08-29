import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { db } from './lib/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Web server untuk Render & UptimeRobot
const app = express();
app.get('/', (req, res) => res.send('🔥 Server Airi Bot Beroperasi!'));
app.listen(config.port, () => console.log(`[HTTP] Server aktif di port ${config.port}`));

// 2. Daftar plugins
const commands = new Map();
async function daftarPlugins() {
    const folderPlugin = path.join(__dirname, 'plugins');
    if (!fs.existsSync(folderPlugin)) fs.mkdirSync(folderPlugin);

    const files = fs.readdirSync(folderPlugin).filter(f => f.endsWith('.js'));
    for (const file of files) {
        const cmd = (await import(`./plugins/${file}`)).default;
        if (cmd?.name) commands.set(cmd.name, cmd);
    }
    console.log(`[PLUGIN] ${commands.size} modules berjaya dipasang.`);
}

// 3. Sambungan Baileys WhatsApp
async function startAiri() {
    await db.connect();
    await daftarPlugins();

    const { state, saveCreds } = await useMultiFileAuthState('./session_airi');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
        if (connection === 'close') {
            const reconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Koneksi terputus! Menyambung semula:', reconnect);
            if (reconnect) startAiri();
        } else if (connection === 'open') {
            console.log('✅ Airi Bot Selamat Terhubung ke WhatsApp!');
        }
    });

   // =========================================================================
    // 🌐 LOOP PEMASA: 100 RANDOM EVENTS & AUTO-LELONGAN SETIAP 12 MINIT
    // =========================================================================
    const activeGroups = new Set();

    sock.ev.on('messages.upsert', ({ messages }) => {
        const jid = messages[0]?.key?.remoteJid;
        if (jid?.endsWith('@g.us')) activeGroups.add(jid);
    });

  setInterval(async () => {
        if (activeGroups.size === 0) return;

        const groupList = Array.from(activeGroups);
        const targetGroup = groupList[Math.floor(Math.random() * groupList.length)];

        const rng = Math.random();

        // 20% Peluang: Trak Duit Terbalik (Event Kilat .kutip)
        if (rng < 0.20) {
            const { triggerSpeedDrop } = await import('./plugins/kutip.js');
            await triggerSpeedDrop(sock, targetGroup);
        }
        // 20% Peluang: Lelongan Kontena Misteri (.bida)
        else if (rng < 0.40) {
            const { triggerRandomAuction } = await import('./plugins/bida.js');
            await triggerRandomAuction(sock, targetGroup);
        }
        // 60% Peluang: 100 Random Events Tempatan
        else {
            const { RANDOM_EVENTS } = await import('./lib/randomEvents.js');
            const allUsers = await db.getAllUsers();
            if (allUsers.length === 0) return;

            const targetUser = allUsers[Math.floor(Math.random() * allUsers.length)];
            const ev = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
            const jumlah = Math.floor(Math.random() * (ev.max - ev.min + 1)) + ev.min;

            if (ev.type === 'untung') {
                targetUser.wallet += jumlah;
                await db.saveUser(targetUser);

                await sock.sendMessage(targetGroup, {
                    text: `\n┌───「 🎁 𝗥𝗘𝗭𝗘𝗞𝗜 𝗥𝗔𝗪𝗔𝗞 𝗧𝗘𝗠𝗣𝗔𝗧𝗔𝗡 」\n├ 👤 𝗣𝗲𝗺𝗮𝗶𝗻 : @${targetUser.id.split('@')[0]}\n├ 📝 𝗦𝗲𝗻𝗮𝗿𝗶𝗼 : ${ev.task}\n├ 💵 𝗧𝘂𝗻𝗮𝗶  : +RM ${jumlah.toLocaleString()}\n└───────────────────────────\n💬 𝗔𝗶𝗿𝗶: "${ev.roast}"`,
                    mentions: [targetUser.id]
                });
            } else {
                targetUser.wallet = Math.max(0, targetUser.wallet - jumlah);
                await db.saveUser(targetUser);

                await sock.sendMessage(targetGroup, {
                    text: `\n┌───「 💀 𝗕𝗘𝗡𝗖𝗔𝗡𝗔 𝗥𝗔𝗪𝗔𝗞 𝗧𝗘𝗠𝗣𝗔𝗧𝗔𝗡 」\n├ 👤 𝗠𝗮𝗻𝗴𝘀𝗮  : @${targetUser.id.split('@')[0]}\n├ 🛑 𝗦𝗲𝗻𝗮𝗿𝗶𝗼 : ${ev.task}\n├ 💸 𝗟𝗲𝗯𝘂   : -RM ${jumlah.toLocaleString()}\n└───────────────────────────\n💬 𝗔𝗶𝗿𝗶: "${ev.roast}"`,
                    mentions: [targetUser.id]
                });
            }
        }
    }, 12 * 60 * 1000);
    
    // 4. Pengendali Mesej (Message Handler)
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        const teks = m.message.conversation || m.message.extendedTextMessage?.text || '';
        const senderJid = m.key.participant || m.key.remoteJid;
        const senderName = m.pushName || 'Warga Gelap';

        // Ambil profil user dari MongoDB
        const user = await db.getUser(senderJid, senderName);

        // Command Handler
        if (teks.startsWith(config.prefix)) {
            const namaCmd = teks.slice(config.prefix.length).trim().split(' ')[0].toLowerCase();
            const action = commands.get(namaCmd);
            if (action) {
                try {
                    await action.execute({ sock, m, user, db });
                } catch (err) {
                    console.error(`Error pada command ${namaCmd}:`, err);
                }
            }
        } 
        // Airi menyampuk santai (Jika nama Airi disebut atau 3% rawak)
        else if (teks.toLowerCase().includes('airi') || (Math.random() < 0.03 && teks.length > 5)) {
            const { askAiri } = await import('./lib/groqAI.js');
            const jawapan = await askAiri(teks, `Pemain bernama ${senderName} tengah bersembang dalam grup.`);
            await sock.sendMessage(m.key.remoteJid, { text: `💬 𝗔𝗶𝗿𝗶: ${jawapan}` }, { quoted: m });
        }
    });
}

startAiri();
