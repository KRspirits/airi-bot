import yts from 'yt-search';
import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const MAX_DURATION_SEC = 600; // Had 10 minit supaya server Render tak berat / OOM
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
            signal: AbortSignal.timeout(6000),
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
            signal: AbortSignal.timeout(60000),
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

// Pre-download yt-dlp di latar belakang masa bot mula jalan supaya command pertama pun laju
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
        execFile(binPath, args, { timeout: 45000, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
            if (err) {
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
    if (e === '.ogg' || e === '.opus') return 'audio/ogg; codecs=opus';
    return 'audio/mp4';
}

// Muat turun audio terus (m4a/mp3) TANPA re-encode ffmpeg supaya sangat laju di Render
async function downloadFastAudio(videoUrl) {
    const binPath = await ensureYtDlp();
    const outBase = path.join(os.tmpdir(), `airi_lagu_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    const outTemplate = `${outBase}.%(ext)s`;
    const cookieFile = writeCookiesFileIfAvailable();

    const common = [
        '--no-playlist',
        '--no-warnings',
        '--no-check-certificates',
        '--socket-timeout', '15',
        '-f', 'ba[ext=m4a]/ba/b',
        '-o', outTemplate,
    ];

    // Cuba beberapa profil client YouTube paling stabil & laju
    const profiles = [];
    if (cookieFile) {
        profiles.push([...common, '--cookies', cookieFile, '--extractor-args', 'youtube:player_client=tv,web_safari,mweb', videoUrl]);
        profiles.push([...common, '--cookies', cookieFile, videoUrl]);
    }
    profiles.push([...common, '--extractor-args', 'youtube:player_client=android_vr,ios', videoUrl]);
    profiles.push([...common, '--extractor-args', 'youtube:player_client=tv_embedded,mweb', videoUrl]);

    let lastErr = new Error('Gagal muat turun audio');
    let downloadedPath = null;

    try {
        for (const args of profiles) {
            try {
                await runYtDlp(binPath, args);
                downloadedPath = findOutputFile(outBase);
                if (downloadedPath && fs.statSync(downloadedPath).size >= 15000) {
                    break;
                }
            } catch (e) {
                lastErr = e;
            }
        }

        if (!downloadedPath || !fs.existsSync(downloadedPath)) {
            throw lastErr;
        }

        const ext = path.extname(downloadedPath) || '.m4a';
        const buffer = fs.readFileSync(downloadedPath);
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
            const searchRes = await yts(query);
            const vids = (searchRes?.videos || []).filter(v => v.seconds > 30 && v.seconds <= MAX_DURATION_SEC);
            const video = vids.find(v => !isUnwantedVersion(v.title, query)) || vids[0];

            if (!video) {
                return sock.sendMessage(
                    jid,
                    { text: `❌ Lagu *${query}* tak dijumpai (atau melebihi had 10 minit).` },
                    { quoted: m }
                );
            }

            const cleanTitle = sanitizeFilename(video.title);

            // Muat turun audio & cari lirik serentak
            const [audio, lyrics] = await Promise.all([
                downloadFastAudio(video.url),
                fetchLyrics(query).then(res => res || fetchLyrics(cleanTitle)),
            ]);

            // Hantar sebagai audio player terus (ikon headphone oren)
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

            // Hantar info lagu + lirik teks
            const header = `🎧 *${video.title}*\n⏱️ Durasi: ${video.timestamp} | ✨ _Airi's Corner_`;
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
                { text: `❌ Gagal muat turun lagu *${query}* buat masa ni.\n_Debug: ${String(err?.message || err).slice(0, 180)}_` },
                { quoted: m }
            );
        }
    },
};
