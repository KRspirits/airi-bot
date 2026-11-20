import yts from 'yt-search';
import ytdl from '@distube/ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import os from 'os';

if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
}

const MAX_DURATION_SEC = 600; // Had 10 minit supaya server Render tak berat / OOM
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

let cachedScClientId = '';
let cachedScAt = 0;

function sanitizeFilename(name) {
    return String(name || 'Lagu')
        .replace(/[\\/:*?"<>|]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 80);
}

function formatDuration(sec) {
    const s = Math.max(0, Math.round(sec || 0));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${String(rem).padStart(2, '0')}`;
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

function convertToMp3Buffer(input, inputOptions = []) {
    return new Promise((resolve, reject) => {
        const tempFile = path.join(os.tmpdir(), `airi_lagu_${Date.now()}_${Math.random().toString(36).slice(2)}.mp3`);
        let settled = false;

        const finish = (err, buf) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch {}
            if (err) reject(err);
            else resolve(buf);
        };

        const cmd = ffmpeg(input);
        if (inputOptions.length) cmd.inputOptions(inputOptions);

        const timer = setTimeout(() => {
            try { cmd.kill('SIGKILL'); } catch {}
            finish(new Error('ffmpeg timeout'));
        }, 55000);

        cmd
            .audioBitrate(128)
            .toFormat('mp3')
            .on('error', err => finish(err))
            .on('end', () => {
                try {
                    const buf = fs.readFileSync(tempFile);
                    if (buf.length < 15000) return finish(new Error('Output MP3 terlalu kecil'));
                    finish(null, buf);
                } catch (e) {
                    finish(e);
                }
            })
            .save(tempFile);
    });
}

// =========================================================================
// 1. SOUNDCLOUD (Tak kena block IP Render, cari full track bukan preview 30s)
// =========================================================================
async function getSoundCloudClientId() {
    if (cachedScClientId && Date.now() - cachedScAt < 6 * 3600 * 1000) {
        return cachedScClientId;
    }
    const homeRes = await fetch('https://soundcloud.com', {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(12000),
    });
    if (!homeRes.ok) throw new Error(`SC home HTTP ${homeRes.status}`);
    const html = await homeRes.text();
    const scripts = [...html.matchAll(/src="(https:\/\/a-v2\.sndcdn\.com\/assets\/[^"]+\.js)"/g)].map(m => m[1]);
    if (!scripts.length) throw new Error('SC tiada skrip aset');

    for (const scriptUrl of scripts.reverse().slice(0, 8)) {
        try {
            const sRes = await fetch(scriptUrl, {
                headers: { 'User-Agent': UA },
                signal: AbortSignal.timeout(10000),
            });
            if (!sRes.ok) continue;
            const js = await sRes.text();
            const m = js.match(/client_id\s*[:=]\s*["']([a-zA-Z0-9]{20,40})["']/);
            if (m) {
                cachedScClientId = m[1];
                cachedScAt = Date.now();
                return cachedScClientId;
            }
        } catch { /* cuba skrip seterusnya */ }
    }
    throw new Error('SC gagal ekstrak client_id');
}

async function downloadViaSoundCloud(query) {
    const clientId = await getSoundCloudClientId();
    const searchUrl = `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(query)}&client_id=${clientId}&limit=8`;
    const res = await fetch(searchUrl, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) {
        if (res.status === 401 || res.status === 403) cachedScClientId = '';
        throw new Error(`SC search HTTP ${res.status}`);
    }
    const data = await res.json();
    const tracks = data?.collection || [];

    // Utamakan lagu penuh (bukan Go+ preview 30 saat)
    const track = tracks.find(t =>
        t?.media?.transcodings?.length > 0 &&
        t.policy !== 'SNIP' &&
        t.policy !== 'BLOCK' &&
        (t.duration || 0) >= 45000 &&
        (t.duration || 0) <= MAX_DURATION_SEC * 1000
    );
    if (!track) throw new Error('SC tiada full track');

    const transcodings = track.media.transcodings;
    const progressive = transcodings.find(t => t.format?.protocol === 'progressive');
    const hls = transcodings.find(t => t.format?.protocol === 'hls' && t.format?.mime_type?.includes('mpeg')) ||
                transcodings.find(t => t.format?.protocol === 'hls');
    const chosen = progressive || hls;
    if (!chosen?.url) throw new Error('SC tiada stream');

    const sep = chosen.url.includes('?') ? '&' : '?';
    const mediaRes = await fetch(`${chosen.url}${sep}client_id=${clientId}`, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(12000),
    });
    if (!mediaRes.ok) throw new Error(`SC media HTTP ${mediaRes.status}`);
    const mediaJson = await mediaRes.json();
    if (!mediaJson?.url) throw new Error('SC tiada URL audio');

    let buffer;
    if (chosen.format?.protocol === 'progressive') {
        const audioRes = await fetch(mediaJson.url, {
            headers: { 'User-Agent': UA },
            signal: AbortSignal.timeout(40000),
        });
        if (!audioRes.ok) throw new Error(`SC audio HTTP ${audioRes.status}`);
        buffer = Buffer.from(await audioRes.arrayBuffer());
        if (buffer.length < 15000) throw new Error('SC audio terlalu kecil');
    } else {
        buffer = await convertToMp3Buffer(mediaJson.url);
    }

    return {
        buffer,
        title: track.title || query,
        timestamp: formatDuration((track.duration || 0) / 1000),
        source: 'SoundCloud',
    };
}

// =========================================================================
// 2. INVIDIOUS (Tarik senarai instance aktif secara dinamik & proxy audio)
// =========================================================================
async function downloadViaInvidious(videoId) {
    if (!videoId) throw new Error('Tiada videoId');
    const listRes = await fetch('https://api.invidious.io/instances.json?sort_by=health', {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(10000),
    });
    if (!listRes.ok) throw new Error(`INV list HTTP ${listRes.status}`);
    const list = await listRes.json();

    const instances = list
        .filter(([, info]) => info?.type === 'https' && info?.api === true && info?.uri)
        .slice(0, 4)
        .map(([, info]) => info.uri.replace(/\/$/, ''));

    if (!instances.length) throw new Error('Tiada instance Invidious');

    let lastErr = new Error('Invidious gagal');
    for (const uri of instances) {
        try {
            const proxyUrl = `${uri}/latest_version?id=${encodeURIComponent(videoId)}&itag=140&local=true`;
            const headRes = await fetch(proxyUrl, {
                method: 'HEAD',
                headers: { 'User-Agent': UA },
                signal: AbortSignal.timeout(10000),
            });
            if (!headRes.ok) throw new Error(`HTTP ${headRes.status}`);
            const buffer = await convertToMp3Buffer(proxyUrl, ['-user_agent', UA]);
            return { buffer, source: 'Invidious' };
        } catch (e) {
            lastErr = e;
        }
    }
    throw lastErr;
}

// =========================================================================
// 3. PIPED (Tarik senarai instance aktif secara dinamik)
// =========================================================================
async function downloadViaPiped(videoId) {
    if (!videoId) throw new Error('Tiada videoId');
    const listRes = await fetch('https://piped-instances.kavin.rocks/', {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(10000),
    });
    if (!listRes.ok) throw new Error(`PIP list HTTP ${listRes.status}`);
    const list = await listRes.json();
    const instances = (Array.isArray(list) ? list : [])
        .filter(i => i?.api_url)
        .slice(0, 4)
        .map(i => i.api_url.replace(/\/$/, ''));

    if (!instances.length) throw new Error('Tiada instance Piped');

    let lastErr = new Error('Piped gagal');
    for (const apiUrl of instances) {
        try {
            const r = await fetch(`${apiUrl}/streams/${encodeURIComponent(videoId)}`, {
                headers: { 'User-Agent': UA },
                signal: AbortSignal.timeout(12000),
            });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const data = await r.json();
            const audio = (data?.audioStreams || [])
                .filter(s => s?.url)
                .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
            if (!audio?.url) throw new Error('Tiada audioStream');
            const buffer = await convertToMp3Buffer(audio.url, ['-user_agent', UA]);
            return { buffer, source: 'Piped' };
        } catch (e) {
            lastErr = e;
        }
    }
    throw lastErr;
}

// =========================================================================
// 4. YTDL-CORE (Backup terakhir)
// =========================================================================
async function downloadViaYtdl(videoUrl) {
    if (!videoUrl) throw new Error('Tiada URL YouTube');
    const stream = ytdl(videoUrl, {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: 1 << 25,
    });
    const buffer = await convertToMp3Buffer(stream);
    return { buffer, source: 'YouTube' };
}

export default {
    name: 'lagu',
    aliases: ['song'],
    description: "Cari lagu, hantar audio MP3 (watermark Airi's Corner) berserta lirik teks.",
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

        const errors = [];
        let video = null;

        try {
            // Cari metadata di YouTube dulu (untuk tajuk/videoId)
            try {
                const searchRes = await yts(query);
                video = searchRes?.videos?.[0] || null;
            } catch (e) {
                errors.push(`YTS:${e?.message || 'err'}`);
            }

            if (video && video.seconds > MAX_DURATION_SEC) {
                return sock.sendMessage(
                    jid,
                    { text: `⚠️ Lagu terlalu panjang (${video.timestamp}). Had maksimum ialah 10 minit.` },
                    { quoted: m }
                );
            }

            // Cari lirik serentak di latar belakang
            const lyricsPromise = fetchLyrics(query).then(res =>
                res || (video?.title ? fetchLyrics(sanitizeFilename(video.title)) : null)
            );

            // Cuba muat turun dari pelbagai sumber secara berturutan
            let result = null;

            const attempts = [
                ['SC', () => downloadViaSoundCloud(query)],
                ['INV', () => downloadViaInvidious(video?.videoId)],
                ['PIP', () => downloadViaPiped(video?.videoId)],
                ['YTDL', () => downloadViaYtdl(video?.url)],
            ];

            for (const [label, fn] of attempts) {
                try {
                    result = await fn();
                    if (result?.buffer) break;
                } catch (e) {
                    const msg = String(e?.message || e).slice(0, 60);
                    errors.push(`${label}:${msg}`);
                    console.warn(`[LAGU ${label} FAIL]`, msg);
                }
            }

            if (!result?.buffer) {
                console.error('[LAGU ALL FAILED]', errors.join(' | '));
                return sock.sendMessage(
                    jid,
                    {
                        text: `❌ Gagal muat turun lagu *${query}* buat masa ni.\n_Debug: ${errors.join(' | ').slice(0, 220)}_`,
                    },
                    { quoted: m }
                );
            }

            const finalTitle = video?.title || result.title || query;
            const finalDuration = result.timestamp || video?.timestamp || '-';
            const cleanTitle = sanitizeFilename(finalTitle);
            const watermarkedName = `${cleanTitle} Airi's Corner.mp3`;

            // Hantar sebagai dokumen audio/mpeg supaya nama fail watermark kelihatan jelas di WhatsApp
            await sock.sendMessage(
                jid,
                {
                    document: result.buffer,
                    mimetype: 'audio/mpeg',
                    fileName: watermarkedName,
                    caption: `🎧 *${finalTitle}*\n⏱️ Durasi: ${finalDuration}\n✨ _Airi's Corner_`,
                },
                { quoted: m }
            );

            // Hantar lirik dalam bentuk teks
            const lyrics = await lyricsPromise;
            if (lyrics) {
                const maxLen = 3800;
                const teksLirik = lyrics.length > maxLen ? `${lyrics.slice(0, maxLen)}\n\n...(lirik dipendekkan)` : lyrics;
                await sock.sendMessage(
                    jid,
                    { text: `📝 *Lirik: ${finalTitle}*\n\n${teksLirik}` },
                    { quoted: m }
                );
            } else {
                await sock.sendMessage(
                    jid,
                    { text: `📝 *${finalTitle}*\n_(Lirik teks tak dijumpai untuk lagu ni)_` },
                    { quoted: m }
                );
            }
        } catch (err) {
            console.error('[LAGU ERROR]', err?.message || err);
            await sock.sendMessage(
                jid,
                { text: `❌ Gagal muat turun lagu buat masa ni.\n_Debug: ${String(err?.message || err).slice(0, 180)}_` },
                { quoted: m }
            );
        }
    },
};
