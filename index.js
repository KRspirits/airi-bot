import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';
import { config, isOwner } from './config.js';
import { db } from './lib/database.js';
import { loadPlugins } from './lib/loader.js';
import { initState, state, addGroup, activeEvent, purgeActive } from './lib/state.js';
import { useMongoAuthState } from './lib/mongoAuth.js';
import { allow } from './lib/cooldown.js';
import { applyEffects, snapshot, CRIME_CMDS, CRIME_PLUGINS } from './lib/effects.js';
import { logEvent } from './lib/log.js';
import { bump } from './lib/quests.js';
import { extractText, parseCmd, mentions, unwrap, num } from './lib/util.js';
import { handleParticipants } from './lib/welcome.js';
import { startScheduler } from './lib/scheduler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// =========================================================================
// 🌐 1. PELAYAN WEB (KEEPALIVE UNTUK RENDER + QR) - letak UptimeRobot ke /ping
// =========================================================================
let currentQR = '', isConnected = false, sock = null, commands = new Map();
const page = body => `<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#0b1030;color:#fff;font-family:system-ui,sans-serif"><div style="text-align:center;padding:28px;max-width:440px;border-radius:24px;background:rgba(255,255,255,.07)">${body}</div>`;
const app = express();
app.get('/ping', (_, res) => res.send('pong'));
app.get('/health', (_, res) => res.json({ ok: true, connected: isConnected, mongo: db.isMongo(), plugins: commands.size, up: Math.round(process.uptime()) }));
app.get('/', async (_, res) => {
    if (isConnected) return res.send(page(`<h2>🌸 Airi's Corner Cyber OS</h2><p style="color:#38e8ff">🟢 Bot aktif dan bersedia.</p><small>${commands.size} command${db.isMongo() ? '' : ' | ⚠️ tiada MongoDB: data hilang bila restart'}</small>`));
    if (currentQR) return res.send(page(`<h2>⚡ Imbas QR Airi</h2><p style="color:#94a3b8;font-size:14px">WhatsApp ➜ Linked Devices ➜ Link a Device</p><img src="${await QRCode.toDataURL(currentQR)}" style="width:280px;height:280px;border-radius:16px;background:#fff;padding:12px"/><p style="color:#ff5555;font-size:12px;margin-top:10px;">Refresh page jika QR tamat tempoh.</p>`));
    res.send(page('<h2>⏳ Menjana QR...</h2><p>Muat semula (refresh) sebentar lagi.</p>'));
});
app.listen(config.port, () => console.log(`[HTTP] Server aktif di port ${config.port}`));

// =========================================================================
// 🚀 2. SAMBUNGAN WHATSAPP
// =========================================================================
let backoff = 2000, connecting = false;

async function connect() {
    if (connecting) return; connecting = true;
    try {
        try { sock?.ev?.removeAllListeners?.(); sock?.end?.(undefined); } catch { /* soket lama */ }
        // Session: MongoDB bila ada (tak perlu scan QR lepas restart Render), jika tidak fail tempatan.
        const auth = db.isMongo() ? await useMongoAuthState() : await useMultiFileAuthState('./session_airi');
        sock = makeWASocket({ auth: auth.state, logger: pino({ level: 'silent' }), browser: ['Airi OS', 'Safari', '2.0.0'], markOnlineOnConnect: false });
        sock.ev.on('creds.update', auth.saveCreds);

        sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
            if (qr) { 
                currentQR = qr; 
                isConnected = false; 
                const renderLink = process.env.RENDER_EXTERNAL_URL || `http://localhost:${config.port}`;
                console.log(`\n⚡ [QR READY] Buka link ini di browser telefon/PC untuk imbas QR:\n👉 ${renderLink}\n`);
                qrcodeTerminal.generate(qr, { small: true }); 
            }
            if (connection === 'open') { isConnected = true; currentQR = ''; backoff = 2000; console.log('✅ Airi selamat terhubung ke WhatsApp!'); }
            if (connection === 'close') {
                isConnected = false;
                const code = lastDisconnect?.error?.output?.statusCode;
                if (code === DisconnectReason.loggedOut) return console.log('🚪 Logged out. Padam session (folder session_airi / koleksi auth Mongo) dan imbas QR semula.');
                console.log(`⚠️ Sambungan terputus (${code ?? '?'}). Sambung semula dalam ${backoff / 1000}s...`);
                setTimeout(() => { connecting = false; connect(); }, backoff); backoff = Math.min(backoff * 2, 30000);
            }
        });

        sock.ev.on('group-participants.update', ev => handleParticipants(sock, ev).catch(e => console.error('[WELCOME]', e.message)));
        sock.ev.on('messages.upsert', ({ messages, type }) => {
            if (type !== 'notify') return;
            for (const m of messages) onMessage(m).catch(e => console.error('[MESSAGE ERROR]', e));
        });
    } finally { connecting = false; }
}

// =========================================================================
// 💬 3. PENGENDALI MESEJ
// =========================================================================
async function onMessage(m) {
    if (!m.message || m.key.remoteJid === 'status@broadcast') return;
    
    m.message = unwrap(m.message); // buka bungkusan ephemeral/viewOnce supaya SEMUA plugin nampak teks
    const jid = m.key.remoteJid;
    const isMe = m.key.fromMe;
    const senderJid = isMe ? (sock.user?.id?.split(':')[0] + '@s.whatsapp.net') : (m.key.participant || jid);
    const senderName = isMe ? 'Owner' : (m.pushName || 'Warga Gelap');
    const teks = extractText(m.message);
    
    if (jid.endsWith('@g.us')) addGroup(jid);

    const parsed = parseCmd(teks, config.prefix);
