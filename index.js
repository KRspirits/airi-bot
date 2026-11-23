import { catatMedia } from './lib/mediaSimpan.js';
import { usingMongo } from './lib/store.js';
import { catatLid, resolveJid, resolveAsync } from './lib/lidmap.js';
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';
import './lib/errlog.js';
import { config, isOwner, isOwnerMsg } from './config.js';
import { withUserLock } from './lib/money.js';
import { patchSend } from './lib/textcards.js';
import { clearSession } from './lib/session.js';
import { LEVEL_REQUIRED, levelOf } from './lib/level.js';
import { trackQuest } from './lib/quest.js';
import { recordActivity, isActive } from './lib/activity.js';
import { resolveAlias } from './lib/aliases.js';
import { panduanSekali } from './lib/panduan.js';
import { resolvePilihan } from './lib/pilihan.js';
import { db } from './lib/database.js';
import { loadPlugins } from './lib/loader.js';
import { initState, state, addGroup, activeEvent, purgeActive } from './lib/state.js';
import { useMongoAuthState } from './lib/mongoAuth.js';
import * as store from './lib/store.js';
import { allow } from './lib/cooldown.js';
import { applyEffects, snapshot, CRIME_CMDS, CRIME_PLUGINS } from './lib/effects.js';
import { logEvent } from './lib/log.js';
import { bump } from './lib/quests.js';
import { extractText, parseCmd, mentions, unwrap, num } from './lib/util.js';
import { handleParticipants } from './lib/welcome.js';
import { startScheduler } from './lib/scheduler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// === PINTASAN PENJIMATAN BANDWIDTH RENDER (0 MB UNTUK GAMBAR) ===
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/KRspirits/airi-bot/main';
const _originalSendMessage = sock.sendMessage.bind(sock);

sock.sendMessage = async (jid, content, options) => {
    if (content?.image && typeof content.image === 'string') {
        const cleanPath = content.image.replace(/^\.?\//, '');
        content.image = { url: `${GITHUB_RAW_BASE}/${cleanPath}` };
    }
    return _originalSendMessage(jid, content, options);
};

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

async function resetAuthStorage() {
    console.log('🧹 Mengosongkan sesi lama...');
    await clearSession(db.isMongo());
}

async function connect() {
    if (connecting) return; 
    connecting = true;
    try {
        try { sock?.ev?.removeAllListeners?.(); sock?.end?.(undefined); } catch { /* tutup soket lama */ }

        let auth;
        try {
            auth = db.isMongo() ? await useMongoAuthState() : await useMultiFileAuthState('./session_airi');
        } catch (e) {
            console.error('[AUTH ERROR] Gagal muat auth state:', e.message);
            await resetAuthStorage();
            auth = await useMultiFileAuthState('./session_airi');
        }

        sock = makeWASocket({ 
            auth: auth.state, 
            logger: pino({ level: 'silent' }), 
            browser: ['Airi OS', 'Safari', '2.0.0'], 
            markOnlineOnConnect: false 
        });
        // Rekod setiap gambar & video yang bot hantar (untuk dipadam tengah malam)
        {
            const _hantar = sock.sendMessage.bind(sock);
            sock.sendMessage = async (jid, kandungan, pilihan) => {
                const hasil = await _hantar(jid, kandungan, pilihan);
                if (hasil?.key && (kandungan?.image || kandungan?.video)) catatMedia(jid, hasil.key);
                return hasil;
            };
        }
        
        sock.ev.on('creds.update', auth.saveCreds);

        sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
            if (qr) { 
                currentQR = qr; 
                isConnected = false; 
                const renderLink = process.env.RENDER_EXTERNAL_URL || `http://localhost:${config.port}`;
                console.log(`\n⚡ [QR READY] Buka link ini di browser telefon/PC untuk imbas QR:\n👉 ${renderLink}\n`);
                qrcodeTerminal.generate(qr, { small: true }); 
            }
            if (connection === 'open') { import('./plugins/bida.js').then(b => b.pulihLelong(sock)).catch(() => {}); import('./lib/bersih.js').then(b => b.mulaBersih(sock)).catch(() => {}); 
                // Amaran kepada owner kalau data tak disimpan kekal (tanpa MONGO_URI)
                if (!usingMongo()) {
                    const nombor = config.ownerNumbers.map(x => String(x).replace(/\D/g, '')).filter(x => x.length >= 10 && x.length <= 15);
                    for (const n of [...new Set(nombor)]) sock.sendMessage(`${n}@s.whatsapp.net`, { text: '⚠️ *AMARAN*: MONGO_URI belum diset. Data pemain (umpan, akuarium, wallet, dll.) akan HILANG bila bot deploy semula. Set MONGO_URI di Render sekarang.' }).catch(() => {});
                }

                isConnected = true; 
                currentQR = ''; 
                backoff = 2000; 
                console.log('✅ Airi selamat terhubung ke WhatsApp!'); 
            }
            if (connection === 'close') {
                isConnected = false;
                const code = lastDisconnect?.error?.output?.statusCode;
                
                if (code === DisconnectReason.loggedOut) {
                    console.log('🚪 Logged out dikesan. Mengosongkan rekod auth dan menjana QR baharu...');
                    await resetAuthStorage();
                    connecting = false;
                    setTimeout(() => connect(), 3000);
                    return;
                }

                console.log(`⚠️ Sambungan terputus (${code ?? '?'}). Sambung semula dalam ${backoff / 1000}s...`);
                setTimeout(() => { connecting = false; connect(); }, backoff); 
                backoff = Math.min(backoff * 2, 30000);
            }
        });

        sock.ev.on('group-participants.update', ev => handleParticipants(sock, ev).catch(e => console.error('[WELCOME]', e.message)));
        patchSend(sock);
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
    
    m.message = unwrap(m.message);
    const jid = m.key.remoteJid;
    if (!m.key.fromMe) recordActivity(jid, m.key.participant || jid); // mesej bot sendiri tak kira sebagai aktiviti
    const isMe = Boolean(m.key.fromMe);
    catatLid(m);
    // pastikan ID sebenar (nombor) diambil dulu, supaya akaun & gambar tak bercampur
    for (const x of (m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [])) await resolveAsync(x, sock);
    const senderJid = isMe ? (sock.user?.id?.split(':')[0] + '@s.whatsapp.net') : await resolveAsync(m.key.participant || jid, sock);
    m.senderJid = senderJid; // ID pemain yang konsisten (nombor telefon bila diketahui)
    const senderName = isMe ? 'Owner' : (m.pushName || 'Warga Gelap');
    let teks = extractText(m.message);
    const pilihanNombor = resolvePilihan(senderJid, teks);
    if (pilihanNombor) teks = pilihanNombor;
    
    if (jid.endsWith('@g.us')) addGroup(jid);

    if (teks) {
        console.log(`[MSG IN] Dari: ${senderJid} | Teks: "${teks}" | fromMe: ${isMe}`);
    }

    m.cmdTeks = teks; // teks arahan sebenar (balasan nombor dah ditukar kepada arahan)
    const parsed = parseCmd(teks, config.prefix);
    if (parsed) {
        console.log(`[CMD DETECTED] Mencari arahan: ".${parsed.cmd}"`);
        parsed.cmd = resolveAlias(parsed.cmd);
        const action = commands.get(parsed.cmd); 
        if (!action) {
            console.log(`[CMD NOT FOUND] Arahan ".${parsed.cmd}" tiada dalam senarai ${commands.size} commands!`);
            return;
        }

        if (state.maintenance && !isOwnerMsg(m)) {
            if (allow('maint:' + jid, 60000)) await sock.sendMessage(jid, { text: '🛠️ Airi tengah dikemaskini sekejap. Cuba lagi nanti ya!' }, { quoted: m });
            return;
        }
        if (!isMe && !allow(senderJid, 1500)) return sock.sendMessage(jid, { react: { text: '⏳', key: m.key } }).catch(() => {});

        return withUserLock(senderJid, async () => {
        const user = await db.getUser(senderJid, senderName), before = snapshot(user);
        // ⛓️ LOKAP: bila dalam lokap, hanya arahan lokap/peguam/rasuah/bank/maklumat dibenarkan.
        // Jenayah, kerja, judi & sebagainya disekat. Owner dikecualikan.
        {
            const LOKAP_BOLEH = new Set(['lokap', 'peguam', 'rasuah', 'mahkamah', 'bal', 'balance', 'ic', 'menu', 'mula', 'panduan', 'help', 'status', 'lb', 'leaderboard', 'papan', 'ringkasan', 'dep', 'wd', 'bank', 'kad_saya', 'jual_kad']);
            const dalamLokapNow = !!user.jail?.status && (user.jail.release_at || 0) > Date.now();
            if (dalamLokapNow && !LOKAP_BOLEH.has(parsed.cmd) && !isOwnerMsg(m)) {
                const sisa = Math.ceil((user.jail.release_at - Date.now()) / 60000);
                return sock.sendMessage(jid, { text: `⛓️ Awak dalam lokap, sisa ${sisa} minit.\nGuna \`.lokap\` untuk pilihan peguam atau rasuah, atau tunggu.` }, { quoted: m });
            }
        }
        await panduanSekali(sock, m, user, db, parsed.cmd);
        trackQuest(senderJid, parsed.cmd).catch(() => {});
        const perlu = LEVEL_REQUIRED[parsed.cmd];
        if (perlu && levelOf(user) < perlu) {
            return sock.sendMessage(jid, { text: `🔒 *${parsed.cmd}* dibuka pada level ${perlu}.\nLevel awak sekarang: ${levelOf(user)}. Kumpul XP dengan \`.kerja\` dan \`.daily\`.` }, { quoted: m });
        }
        try { 
            await action.execute({ sock, m, user, db, args: parsed.args || [] });
        }
        catch (err) {
            console.error(`[COMMAND ERROR] .${parsed.cmd}:`, err);
            await sock.sendMessage(jid, { text: 'Ada masalah sekejap. Cuba lagi ya, kalau masih sama bagitahu owner.' }, { quoted: m }).catch(() => {});
            return;
        }
        await afterCommand({ m, jid, senderJid, senderName, cmd: parsed.cmd, action, before });
        });
        return;
    }

    if (isMe) return;

    const low = teks.toLowerCase();
    const hot = ['kalah', 'sengkek', 'scam', 'koyak', 'pinjam seratus', 'sedih', 'takde duit', 'barai'].some(k => low.includes(k));
    if (!(low.includes('airi') || (hot && isActive(jid, 3) && Math.random() < 0.06 && teks.length > 5))) return;
    if (!allow('chat:' + senderJid, 15000)) return;
    try {
        const { askAiri } = await import('./lib/geminiAI.js');
        const { profileSummary } = await import('./lib/memory.js');
        const user = await db.getUser(senderJid, senderName);
        if (!isMe && m.pushName && user.pushName !== m.pushName) { user.pushName = m.pushName; await db.saveUser(user).catch(() => {}); }
        const situasi = (hot ? `Pemain ${senderName} sembang isu sensitif: "${teks}". Sampuk comel, ceria dan menyakat mesra.` : `Pemain ${senderName} panggil awak: "${teks}". Jawab periang dan mesra.`)
            + `\nDATA PEMAIN (rujukan sahaja):\n${await profileSummary(senderJid, senderName, user)}`;
        await sock.sendMessage(jid, { text: `💬 𝗔𝗶𝗿𝗶: ${await askAiri(teks, situasi)}` }, { quoted: m });
    } catch (err) { console.error('[AI CHAT ERROR]', err.message); }
}

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
