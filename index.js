import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';
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

// =========================================================================
// 🌐 1. PELAYAN WEB RINGAN (KEEPALIVE UNTUK RENDER / UPTIMEROBOT)
// =========================================================================
const app = express();
app.get('/', (req, res) => res.send('✨ Airi Bot Cyber OS Beroperasi Secara 24/7! 🌸'));
app.listen(config.port, () => console.log(`[HTTP] Server aktif di port ${config.port}`));

// =========================================================================
// 🧩 2. ENJIN AUTO-LOADER PLUGINS (BACA SEMUA FAIL DALAM plugins/)
// =========================================================================
const commands = new Map();

async function muatTurunPlugins() {
    commands.clear();
    const folderPlugin = path.join(__dirname, 'plugins');
    if (!fs.existsSync(folderPlugin)) fs.mkdirSync(folderPlugin);

    const files = fs.readdirSync(folderPlugin).filter(f => f.endsWith('.js'));
    for (const file of files) {
        try {
            const module = await import(`./plugins/${file}?update=${Date.now()}`);
            const cmd = module.default;
            if (cmd?.name) {
                commands.set(cmd.name.toLowerCase(), cmd);
                if (Array.isArray(cmd.alias)) {
                    cmd.alias.forEach(aliasName => commands.set(aliasName.toLowerCase(), cmd));
                }
            }
        } catch (err) {
            console.error(`[PLUGIN ERROR] Gagal memuatkan fail plugins/${file}:`, err);
        }
    }
    console.log(`[PLUGIN] Berjaya mendaftarkan ${commands.size} perintah modular.`);
}

// =========================================================================
// 🚀 3. ENJIN TERAS AIRI BOT (BAILEYS & AUTOMATION LOOPS)
// =========================================================================
async function startAiriBot() {
    await db.connect();
    await muatTurunPlugins();

    const { state, saveCreds } = await useMultiFileAuthState('./session_airi');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }),
        browser: ['Airi OS', 'Safari', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('⚠️ Sambungan terputus! Menyambung semula:', shouldReconnect);
            if (shouldReconnect) startAiriBot();
        } else if (connection === 'open') {
            console.log('✅ Airi Bot Selamat Terhubung ke WhatsApp!');
        }
    });

    // Senarai ID Grup Aktif untuk Automasi
    const activeGroups = new Set();

    // =========================================================================
    // 🌐 4. PEMASA RAWAK: KONTENA LELONGAN, EVENT KILAT & 100 RANDOM SCENARIOS
    // =========================================================================
    setInterval(async () => {
        if (activeGroups.size === 0) return;

        const groupList = Array.from(activeGroups);
        const targetGroup = groupList[Math.floor(Math.random() * groupList.length)];
        const rng = Math.random();

        try {
            // 20% Peluang: Trak Wang Terbalik (Event Reaksi Pantas .kutip)
            if (rng < 0.20) {
                const { triggerSpeedDrop } = await import('./plugins/kutip.js');
                await triggerSpeedDrop(sock, targetGroup);
            }
            // 20% Peluang: Lelongan Kontena Misteri (.bida)
            else if (rng < 0.40) {
                const { triggerRandomAuction } = await import('./plugins/bida.js');
                await triggerRandomAuction(sock, targetGroup);
            }
            // 60% Peluang: 100 Random Events Tempatan (Untung / Bencana)
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

                    const teksUntung = `
┌───「 🎁 𝗥𝗘𝗭𝗘𝗞𝗜 𝗥𝗔𝗪𝗔𝗞 𝗧𝗘𝗠𝗣𝗔𝗧𝗔𝗡 」
├ 👤 𝗣𝗲𝗺𝗮𝗶𝗻 : @${targetUser.id.split('@')[0]}
├ 📝 𝗦𝗲𝗻𝗮𝗿𝗶𝗼 : ${ev.task}
├ 💵 𝗧𝘂𝗻𝗮𝗶  : +RM ${jumlah.toLocaleString()}
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "${ev.roast}"`;

                    await sock.sendMessage(targetGroup, {
                        text: teksUntung,
                        mentions: [targetUser.id]
                    });
                } else {
                    targetUser.wallet = Math.max(0, targetUser.wallet - jumlah);
                    await db.saveUser(targetUser);

                    const teksRugi = `
┌───「 💀 𝗕𝗘𝗡𝗖𝗔𝗡𝗔 𝗥𝗔𝗪𝗔𝗞 𝗧𝗘𝗠𝗣𝗔𝗧𝗔𝗡 」
├ 👤 𝗠𝗮𝗻𝗴𝘀𝗮  : @${targetUser.id.split('@')[0]}
├ 🛑 𝗦𝗲𝗻𝗮𝗿𝗶𝗼 : ${ev.task}
├ 💸 𝗟𝗲𝗯𝘂   : -RM ${jumlah.toLocaleString()}
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "${ev.roast}"`;

                    await sock.sendMessage(targetGroup, {
                        text: teksRugi,
                        mentions: [targetUser.id]
                    });
                }
            }
        } catch (err) {
            console.error('[AUTO EVENT ERROR]:', err);
        }
    }, 12 * 60 * 1000); // Berjalan automatik setiap 12 minit

    // =========================================================================
    // 💬 5. PENGENDALI MESEJ (COMMAND HANDLER & AIRI CCTV INTERCEPTOR)
    // =========================================================================
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        const teks = m.message.conversation || m.message.extendedTextMessage?.text || '';
        const jid = m.key.remoteJid;
        const senderJid = m.key.participant || jid;
        const senderName = m.pushName || 'Warga Gelap';

        // Rekod grup aktif untuk kegunaan pemasa rawak
        if (jid.endsWith('@g.us')) {
            activeGroups.add(jid);
        }

        // Ambil profil pengguna daripada MongoDB Atlas
        const user = await db.getUser(senderJid, senderName);

        // A. JIKA MENGGUNAKAN PREFIX TITIK (.)
        if (teks.startsWith(config.prefix)) {
            const namaCmd = teks.slice(config.prefix.length).trim().split(' ')[0].toLowerCase();
            const action = commands.get(namaCmd);

            if (action) {
                try {
                    await action.execute({ sock, m, user, db });
                } catch (err) {
                    console.error(`[COMMAND ERROR] Ralat pada perintah .${namaCmd}:`, err);
                    await sock.sendMessage(jid, { 
                        text: 'Aduh, ada wayar sistem tersangkut sekejap hehe~ Cuba lagi kejap lagi ya! 🥺' 
                    }, { quoted: m });
                }
            }
        } 
        // B. AIRI CCTV INTERCEPTOR (MENYAMPUK SPONTAN, COMEL & PERIANG)
        else {
            const teksLower = teks.toLowerCase();
            const kataKunciPanas = ['kalah', 'sengkek', 'scam', 'koyak', 'pinjam seratus', 'sedih', 'takde duit', 'barai'];
            const adaIsuPanas = kataKunciPanas.some(kata => teksLower.includes(kata));

            // Airi menyampuk jika namanya disebut ATAU (ada drama panas & 6% peluang rawak)
            if (teksLower.includes('airi') || (adaIsuPanas && Math.random() < 0.06 && teks.length > 5)) {
                try {
                    const { askAiri } = await import('./lib/groqAI.js');
                    const situasi = adaIsuPanas 
                        ? `Pemain bernama ${senderName} tengah sembang pasal isu sensitif: "${teks}". Sampuk secara comel, ceria tapi ada unsur menyakat kelakar!` 
                        : `Pemain bernama ${senderName} panggil nama kau dalam sembang: "${teks}". Jawab dengan nada periang dan manja!`;

                    const jawapanAiri = await askAiri(teks, situasi);
                    await sock.sendMessage(jid, { text: `💬 𝗔𝗶𝗿𝗶: ${jawapanAiri}` }, { quoted: m });
                } catch (err) {
                    console.error('[AI CHAT ERROR]:', err);
                }
            }
        }
    });
}

// Mulakan bot
startAiriBot().catch(err => console.error('[FATAL ERROR]:', err));
