import yts from 'yt-search';
import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const MAX_DURATION_SEC = 600; // Had 10 minit
const YTDLP_BIN = path.join(os.tmpdir(), process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
const YTDLP_URL = process.platform === 'win32'
    ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
    : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux';

let downloadingBin = null;

function sanitizeFilename(name) {
    return String(name || 'Lagu')
        .replace(/[\\/:*?"<>|]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 80);
}

function isUnwantedVersion(title, query) {
    const t = String(title || '').toLowerCase();
    const q = String(query || '').toLowerCase();
    const badWords = [
        'instrumental', 'karaoke', 'minus one', '8d audio', 'slowed',
        'reverb', 'sped up', 'nightcore', 'piano cover', 'guitar cover', 'drum cover',
    ];
    for (const w of badWords) {
        if (t.includes(w) && !q.includes(w.split(' ')[0])) {
            return true;
        }
    }
    return false;
}

async function fetchLyrics(query) {
    try {
        const url = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
        const res = await fetch(url, {
            headers: { 'User-Agent': 'AiriCornerBot/2.0' },
            signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
            const match = data.find(item => item.plainLyrics && item.plainLyrics.trim());
            if (match) return match.plainLyrics.trim();
        }
        return null;
    } catch {
        return null;
    }
}

async function ensureYtDlp() {
    if (fs.existsSync(YTDLP_BIN) && fs.statSync(YTDLP_BIN).size > 1_000_000) {
        return YTDLP_BIN;
    }
    if (downloadingBin) return downloadingBin;

    downloadingBin = (async () => {
        const res = await fetch(YTDLP_URL, {
            redirect: 'follow',
            signal: AbortSignal.timeout(30000),
        });
        if (!res.ok) throw new Error(`Gagal muat turun yt-dlp (HTTP ${res.status})`);
        const buf = Buffer.from(await res.arrayBuffer());
        const tmpPart = `${YTDLP_BIN}.part`;
        fs.writeFileSync(tmpPart, buf);
        if (process.platform !== 'win32') {
            fs.chmodSync(tmpPart, 0o755);
        }
        fs.renameSync(tmpPart, YTDLP_BIN);
        return YTDLP_BIN;
    })();

    try {
        return await downloadingBin;
    } finally {
        downloadingBin = null;
    }
}

// Pre-download yt-dlp di latar belakang masa bot mula hidup
ensureYtDlp().catch(() => {});

function writeCookiesFileIfAvailable() {
    const raw = process.env.YT_COOKIES;
    if (!raw) return null;
    try {
        const cookies = JSON.parse(raw);
        if (!Array.isArray(cookies) || !cookies.length) return null;

        const lines = ['# Netscape HTTP Cookie File'];
        for (const c of cookies) {
            if (!c?.domain || !c?.name) continue;
            const domain = String(c.domain);
            const includeSub = domain.startsWith('.') ? 'TRUE' : 'FALSE';
            const cookiePath = String(c.path || '/');
            const secure = c.secure ? 'TRUE' : 'FALSE';
            const expiry = c.expirationDate ? Math.floor(Number(c.expirationDate)) : 0;
            const name = String(c.name);
            const value = String(c.value ?? '');
            lines.push(`${domain}\t${includeSub}\t${cookiePath}\t${secure}\t${expiry}\t${name}\t${value}`);
        }
        const cookieFile = path.join(os.tmpdir(), `airi_yt_cookies_${Date.now()}.txt`);
        fs.writeFileSync(cookieFile, lines.join('\n') + '\n', 'utf8');
        return cookieFile;
    } catch {
        return null;
    }
}

function runYtDlp(binPath, args) {
    return new Promise((resolve, reject) => {
        execFile(binPath, args, { timeout: 22000, maxBuffer: 5 * 1024 * 1024 }, (err, stdout, stderr) => {
            if (err) {
                if (err.killed) return reject(new Error('Timeout (22s)'));
                const detail = String(stderr || err.message || err)
                    .split('\n')
                    .filter(l => l.includes('ERROR:'))
                    .pop() || String(err.message || err);
                return reject(new Error(detail.replace(/^ERROR:\s*/i, '').trim()));
            }
            resolve(stdout);
        });
    });
}

function findOutputFile(outBase) {
    const dir = path.dirname(outBase);
    const prefix = path.basename(outBase) + '.';
    const files = fs.readdirSync(dir).filter(f => f.startsWith(prefix) && !f.endsWith('.part'));
    if (!files.length) return null;
    return path.join(dir, files[0]);
}

function mimeForExt(ext) {
    const e = ext.toLowerCase();
    if (e === '.mp3') return 'audio/mpeg';
    if (e === '.m4a' || e === '.mp4') return 'audio/mp4';
    if (e === '.ogg' || e === '.opus' || e === '.webm') return 'audio/ogg; codecs=opus';
    return 'audio/mp4';
}

// Ringan & pantas: 1 percubaan terus tanpa spawn Node kedua (elak Render OOM / bot diam)
async function downloadFastAudio(target) {
    const binPath = await ensureYtDlp();
    const outBase = path.join(os.tmpdir(), `airi_lagu_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    const outTemplate = `${outBase}.%(ext)s`;
    const cookieFile = writeCookiesFileIfAvailable();

    const args = [
        '--no-playlist',
        '--no-warnings',
        '--no-check-certificates',
        '--socket-timeout', '10',
        '--match-filter', `duration <= ${MAX_DURATION_SEC}`,
        '-f', 'bestaudio/best',
        '-o', outTemplate,
    ];

    if (cookieFile) {
        args.push('--cookies', cookieFile);
    } else {
        args.push('--extractor-args', 'youtube:player_client=android_vr,ios');
    }
    args.push(target);

    try {
        await runYtDlp(binPath, args);
        const downloadedPath = findOutputFile(outBase);
        if (!downloadedPath || !fs.existsSync(downloadedPath)) {
            throw new Error('Fail audio tidak dijana');
        }
        const buffer = fs.readFileSync(downloadedPath);
        if (buffer.length < 15000) {
            throw new Error('Fail audio terlalu kecil');
        }
        const ext = path.extname(downloadedPath) || '.m4a';
        return { buffer, mimetype: mimeForExt(ext), ext };
    } finally {
        try {
            const dir = path.dirname(outBase);
            const prefix = path.basename(outBase) + '.';
            for (const f of fs.readdirSync(dir)) {
                if (f.startsWith(prefix)) fs.unlinkSync(path.join(dir, f));
            }
        } catch {}
        try { if (cookieFile && fs.existsSync(cookieFile)) fs.unlinkSync(cookieFile); } catch {}
    }
}

export default {
    name: 'lagu',
    aliases: ['song', 'play'],
    description: "Cari lagu, hantar audio player pantas berserta lirik teks.",
    async execute({ sock, m, args }) {
        const jid = m.key.remoteJid;
        const query = (args || []).join(' ').trim();

        if (!query) {
            return sock.sendMessage(
                jid,
                { text: '🎵 Sila masukkan nama lagu.\nContoh: `.lagu Krewella Alive`' },
                { quoted: m }
            );
        }

        await sock.sendMessage(
            jid,
            { text: `🔍 Tengah cari lagu *${query}*...` },
            { quoted: m }
        );

        try {
            let video = null;
            try {
                const searchRes = await Promise.race([
                    yts(query),
                    new Promise((_, rej) => setTimeout(() => rej(new Error('yts timeout')), 6000)),
                ]);
                const allVids = searchRes?.videos || [];
                const filtered = allVids.filter(v => !v.seconds || (v.seconds > 20 && v.seconds <= MAX_DURATION_SEC));
                video = filtered.find(v => !isUnwantedVersion(v.title, query)) || filtered[0] || allVids[0] || null;
            } catch {
                video = null;
            }

            const target = video?.url || `ytsearch1:${query} official audio`;
            const finalTitle = video?.title || query;
            const finalDuration = video?.timestamp || '-';
            const cleanTitle = sanitizeFilename(finalTitle);

            const [audio, lyrics] = await Promise.all([
                downloadFastAudio(target),
                fetchLyrics(query).then(res => res || (video?.title ? fetchLyrics(cleanTitle) : null)),
            ]);

            await sock.sendMessage(
                jid,
                {
                    audio: audio.buffer,
                    mimetype: audio.mimetype,
                    ptt: false,
                    fileName: `${cleanTitle} Airi's Corner${audio.ext}`,
                },
                { quoted: m }
            );

            const header = `🎧 *${finalTitle}*\n⏱️ Durasi: ${finalDuration} | ✨ _Airi's Corner_`;
            if (lyrics) {
                const maxLen = 3700;
                const teksLirik = lyrics.length > maxLen ? `${lyrics.slice(0, maxLen)}\n\n...(lirik dipendekkan)` : lyrics;
                await sock.sendMessage(
                    jid,
                    { text: `${header}\n\n📝 *Lirik:*\n${teksLirik}` },
                    { quoted: m }
                );
            } else {
                await sock.sendMessage(
                    jid,
                    { text: `${header}\n\n_(Lirik teks tak dijumpai untuk lagu ni)_` },
                    { quoted: m }
                );
            }
        } catch (err) {
            console.error('[LAGU ERROR]', err?.message || err);
            await sock.sendMessage(
                jid,
                { text: `❌ Gagal muat turun lagu *${query}*.\n_Debug: ${String(err?.message || err).slice(0, 180)}_` },
                { quoted: m }
            );
        }
    },
};
