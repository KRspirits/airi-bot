import yts from 'yt-search';
import ffmpegPath from 'ffmpeg-static';
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
            signal: AbortSignal.timeout(8000),
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

// Muat turun binary yt-dlp rasmi sekali sahaja ke folder /tmp (tak perlu install Python)
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

// Tukar YT_COOKIES (JSON dari Cookie-Editor) kepada format Netscape cookies.txt untuk yt-dlp
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
        execFile(binPath, args, { timeout: 90000, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
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

async function downloadMp3WithYtDlp(videoUrl, title) {
    const binPath = await ensureYtDlp();
    const outBase = path.join(os.tmpdir(), `airi_lagu_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    const outTemplate = `${outBase}.%(ext)s`;
    const outMp3 = `${outBase}.mp3`;
    const cookieFile = writeCookiesFileIfAvailable();

    const baseArgs = [
        '--no-playlist',
        '--no-warnings',
        '-x',
        '--audio-format', 'mp3',
        '--audio-quality', '128K',
        '--postprocessor-args', `ffmpeg:-metadata title="${sanitizeFilename(title)} (Airi's Corner)" -metadata artist="Airi's Corner"`,
        '-o', outTemplate,
    ];
    if (ffmpegPath) {
        baseArgs.push('--ffmpeg-location', ffmpegPath);
    }

    try {
        try {
            const args = [...baseArgs];
            if (cookieFile) args.push('--cookies', cookieFile);
            args.push(videoUrl);
            await runYtDlp(binPath, args);
        } catch (firstErr) {
            // Backup: cuba client android/ios jika percubaan pertama sangkut
            const fallbackArgs = [
                ...baseArgs,
                '--extractor-args', 'youtube:player_client=android,ios',
                videoUrl,
            ];
            try {
                await runYtDlp(binPath, fallbackArgs);
            } catch {
                throw firstErr;
            }
        }

        if (!fs.existsSync(outMp3)) {
            throw new Error('Fail MP3 tidak dijana');
        }
        const buf = fs.readFileSync(outMp3);
        if (buf.length < 15000) {
            throw new Error('Fail MP3 terlalu kecil');
        }
        return buf;
    } finally {
        try { if (fs.existsSync(outMp3)) fs.unlinkSync(outMp3); } catch {}
        try { if (cookieFile && fs.existsSync(cookieFile)) fs.unlinkSync(cookieFile); } catch {}
    }
}

export default {
    name: 'lagu',
    aliases: ['song', 'play'],
    description: "Cari lagu, hantar audio player (watermark Airi's Corner) berserta lirik teks.",
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
            const watermarkedName = `${cleanTitle} Airi's Corner.mp3`;

            // Muat turun audio (yt-dlp) & cari lirik serentak
            const [audioBuffer, lyrics] = await Promise.all([
                downloadMp3WithYtDlp(video.url, video.title),
                fetchLyrics(query).then(res => res || fetchLyrics(cleanTitle)),
            ]);

            // Hantar sebagai audio player terus (ikon headphone oren)
            await sock.sendMessage(
                jid,
                {
                    audio: audioBuffer,
                    mimetype: 'audio/mpeg',
                    ptt: false,
                    fileName: watermarkedName,
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
