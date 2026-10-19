import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import express from 'express';
import path from 'path';
import fs from 'fs';
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
    if (currentQR) return res.send(page(`<h2>⚡ Imbas QR Airi</h2><p style="color:#94a3b8;font-size:14px">WhatsApp ➜ Linked Devices ➜ Link a Device</p><img src="${await QRCode.toDataURL(currentQR)}" style="width:280px;height:280px;border-radius:16px;background:#fff;padding:12px"/><p style="color:#ff5555;font-size:12px;margin-top:10px;">Halaman akan auto-kemas kini bila QR baharu dijana.</p>`));
    res.send(page('<h2>⏳ Menjana QR...</h2><p>Sila refresh laman web ini dalam 5 saat.</p>'));
});
app.listen(config.port, () => console.log(`[HTTP] Server aktif di port ${config.port}`));

// =========================================================================
// 🚀 2. SAMBUNGAN WHATSAPP
// =========================================================================
let backoff = 2000, connecting = false;

async function connect() {
    if (connecting) return; 
    connecting = true;
    try {
        try { sock?.ev?.removeAllListeners?.(); sock?.end?.(undefined); } catch { /* tutup soket lama */ }

        // Pengurusan Sesi: MongoDB jika ada, jika tidak gunakan storan fail setempat
        let auth;
        try {
            auth = db.isMongo() ? await useMongoAuthState() : await useMultiFileAuthState('./session_airi');
        } catch (authErr) {
            console.error('Gagal memuatkan auth state lama. Mengosongkan fail sesi:', authErr.message);
            if (fs.existsSync('./session_airi')) fs.rmSync('./session_airi', { recursive: true, force: true });
            auth = await useMultiFileAuthState('./session_airi');
        }

        sock = makeWASocket({ 
            auth: auth.state, 
            logger: pino({ level: 'silent' }), 
            browser: ['Airi OS', 'Safari', '2.0.0'], 
            markOnlineOnConnect: false 
        });
        
        sock.ev.on('creds.update', auth.saveCreds);

        sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
            if (qr) { 
                currentQR = qr; 
                isConnected = false; 
                const renderLink = process.env.RENDER_EXTERNAL_URL || `http://localhost:${config.port}`;
                console.log(`\n⚡ [QR DIJANA] Buka link ini di browser telefon/PC untuk imbas:\n👉 ${renderLink}\n`);
                qrcodeTerminal.generate(qr, { small: true }); 
            }
            if (connection === 'open') { 
                isConnected = true; 
                currentQR = ''; 
                backoff = 2000; 
                console.log('✅ Airi selamat terhubung ke WhatsApp!'); 
            }
            if (connection === 'close') {
                isConnected = false;
                const code = lastDisconnect?.error?.output?.statusCode;
                
                // Jika WhatsApp force logout, buang folder fail rosak dan minta QR baru
                if (code === DisconnectReason.loggedOut) {
                    console.log('🚪 Logged out dikesan. Memadam fail sesi lama untuk menjana QR baharu...');
                    try {
                        if (fs.existsSync('./session_airi')) {
                            fs.rmSync('./session_airi', { recursive: true, force: true });
                        }
                    } catch (e) {
                        console.error('Gagal memadam sesi:', e.message);
                    }
                    connecting = false;
                    setTimeout(() => connect(), 2000);
                    return;
                }

                console.log(`⚠️ Sambungan terputus (${code ?? '?'}). Sambung semula dalam ${backoff / 1000}s...`);
                setTimeout(() => { connecting = false; connect(); }, backoff); 
                backoff = Math.min(backoff * 2, 30000);
            }
        });

        sock.ev.on('group-participants.update', ev => handleParticipants(sock, ev).catch(e => console.error('[WELCOME]', e.message)));
        sock.ev.on('messages.upsert', ({ messages, type }) => {
            if (type !== 'notify') return;
            for (const m of messages) onMessage(m).catch(e => console.error('[MESSAGE ERROR]', e));
        });
    } finally { 
        connecting = false; 
    }
}

// =========================================================================
// 💬 3. PENGENDALI MESEJ
// =========================================================================
const chatCooldown = new Map();

async function onMessage(m) {
    if (!m.message || m.key.remoteJid === 'status@broadcast') return;
    
    m.message = unwrap(m.message); // Buka viewOnce / ephemeral teks
    const jid = m.key.remoteJid;
    const isMe = Boolean(m.key.fromMe);
    const senderJid = isMe ? (sock.user?.id?.split(':')[0] + '@s.whatsapp.net') : (m.key.participant || jid);
    const senderName = isMe ? 'Owner' : (m.pushName || 'Warga Gelap');
    const teks = extractText(m.message);
    
    if (jid.endsWith('@g.us')) addGroup(jid);

    const parsed = parseCmd(teks, config.prefix);
    if (parsed) {
        const action = commands.get(parsed.cmd); 
        if (!action) return;
        
        if (state.maintenance && !isOwner(senderJid)) {
            if (allow('maint:' + jid, 60000)) await sock.sendMessage(jid, { text: '🛠️ Airi tengah dikemaskini sekejap. Cuba lagi nanti ya!' }, { quoted: m });
            return;
        }
        if (!isMe && !allow(senderJid, 1500)) return sock.sendMessage(jid, { react: { text: '⏳', key: m.key } }).catch(() => {});

        const user = await db.getUser(senderJid, senderName), before = snapshot(user);
        try { 
            await action.execute({ sock, m, user, db, args: parsed.args || [] }); 
        }
        catch (err) {
            console.error(`[COMMAND ERROR] .${parsed.cmd}:`, err);
            await sock.sendMessage(jid, { text: 'Aduh, ada wayar tersangkut sekejap hehe~ Cuba lagi kejap lagi ya! 🥺' }, { quoted: m }).catch(() => {});
            return;
        }
        await afterCommand({ m, jid, senderJid, senderName, cmd: parsed.cmd, action, before });
        return;
    }

    // Jika mesej dari diri sendiri dan bukan arahan, abaikan sembang AI
    if (isMe) return;

    // Airi menyampuk sembang
    const low = teks.toLowerCase();
    const hot = ['kalah', 'sengkek', 'scam', 'koyak', 'pinjam seratus', 'sedih', 'takde duit', 'barai'].some(k => low.includes(k));
    if (!(low.includes('airi') || (hot && Math.random() < 0.06 && teks.length > 5))) return;
    if (!allow('chat:' + senderJid, 15000)) return;
    try {
        const { askAiri } = await import('./lib/geminiAI.js');
        const { profileSummary } = await import('./lib/memory.js');
        const user = await db.getUser(senderJid, senderName);
        const situasi = (hot ? `Pemain ${senderName} sembang isu sensitif: "${teks}". Sampuk comel, ceria dan menyakat mesra.` : `Pemain ${senderName} panggil kau: "${teks}". Jawab periang dan mesra.`)
            + `\nDATA PEMAIN (rujukan sahaja):\n${await profileSummary(senderJid, senderName, user)}`;
        await sock.sendMessage(jid, { text: `💬 𝗔𝗶𝗿𝗶: ${await askAiri(teks, situasi)}` }, { quoted: m });
    } catch (err) { console.error('[AI CHAT ERROR]', err.message); }
}

// Selepas command
async function afterCommand({ m, jid, senderJid, senderName, cmd, action, before }) {
    try {
        const fresh = await db.getUser(senderJid, senderName);
        const isCrime = CRIME_CMDS.has(cmd) || CRIME_PLUGINS.has(action.name);
        const res = applyEffects({ cmd, isCrime, user: fresh, before, event: activeEvent(), purge: purgeActive() });
        bump(fresh, cmd);
        if (isCrime) {
            await logEvent({ type: 'crime', actor: senderJid, target: mentions(m).find(t => num(t) !== num(senderJid)) || null, cmd, amount: res.delta, ok: res.delta > 0, group: jid });
        }
        if (res.jailedNow) await logEvent({ type: 'jail', actor: senderJid, cmd, group: jid });
        await db.saveUser(fresh);
        if (res.messages.length) await sock.sendMessage(jid, { text: res.messages.join('\n') }, { quoted: m });
    } catch (e) { console.error('[AFTER COMMAND]', e.message); }
}

// =========================================================================
// ▶️ 4. MULA
// =========================================================================
async function main() {
    await db.connect();
    await initState();
    const r = await loadPlugins(path.join(__dirname, 'plugins'));
    commands = r.map;
    console.log(`[PLUGIN] ${r.plugins} plugin, ${r.count} command.`);
    if (r.conflicts.length) console.log('[PLUGIN] Konflik alias:\n  ' + r.conflicts.join('\n  '));
    startScheduler(() => (isConnected ? sock : null));
    await connect();
}
main().catch(err => console.error('[FATAL]', err));
process.on('unhandledRejection', e => console.error('[UNHANDLED]', e));
