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

function isUnwantedVersion(title, query) {
    const t = String(title || '').toLowerCase();
    const q = String(query || '').toLowerCase();
    const badWords = ['instrumental', 'karaoke', 'minus one', '8d audio', 'slowed', 'reverb', 'sped up', 'nightcore', 'piano cover', 'guitar cover', 'drum cover'];
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

async function downloadBufferFromUrl(url, extraHeaders = {}) {
    const res = await fetch(url, {
        headers: { 'User-Agent': UA, ...extraHeaders },
        signal: AbortSignal.timeout(45000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 15000) throw new Error('Fail audio terlalu kecil');
    return buf;
}

function processMp3WithWatermark(input, title, inputOptions = []) {
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
        }, 60000);

        cmd
            .audioBitrate(128)
            .toFormat('mp3')
            .outputOptions([
                '-metadata', `title=${sanitizeFilename(title)} (Airi's Corner)`,
                '-metadata', "artist=Airi's Corner",
                '-metadata', "album=Airi's Corner Music",
            ])
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
// 1. SAVETUBE (YouTube -> MP3, popular untuk bot WA, tak kena block IP Render)
// =========================================================================
async function downloadViaSaveTube(videoUrl) {
    if (!videoUrl) throw new Error('Tiada URL YouTube');
    const cdnRes = await fetch('https://media.savetube.me/api/random-cdn', {
        headers: { 'User-Agent': UA, 'Origin': 'https://yt.savetube.me', 'Referer': 'https://yt.savetube.me/' },
        signal: AbortSignal.timeout(12000),
    });
    if (!cdnRes.ok) throw new Error(`ST cdn HTTP ${cdnRes.status}`);
    const cdnJson = await cdnRes.json();
    const cdn = cdnJson?.cdn;
    if (!cdn) throw new Error('ST tiada CDN');

    const infoRes = await fetch(`https://${cdn}/v2/info`, {
        method: 'POST',
        headers: {
            'User-Agent': UA,
            'Content-Type': 'application/json',
            'Origin': 'https://yt.savetube.me',
            'Referer': 'https://yt.savetube.me/',
        },
        body: JSON.stringify({ url: videoUrl }),
        signal: AbortSignal.timeout(15000),
    });
    if (!infoRes.ok) throw new Error(`ST info HTTP ${infoRes.status}`);
    const infoJson = await infoRes.json();
    const key = infoJson?.data?.key;
    if (!key) throw new Error('ST tiada key');

    const dlRes = await fetch(`https://${cdn}/download`, {
        method: 'POST',
        headers: {
            'User-Agent': UA,
            'Content-Type': 'application/json',
            'Origin': 'https://yt.savetube.me',
            'Referer': 'https://yt.savetube.me/',
        },
        body: JSON.stringify({
            downloadType: 'audio',
            quality: '128',
            key,
        }),
        signal: AbortSignal.timeout(20000),
    });
    if (!dlRes.ok) throw new Error(`ST dl HTTP ${dlRes.status}`);
    const dlJson = await dlRes.json();
    const dlUrl = dlJson?.data?.downloadUrl;
    if (!dlUrl) throw new Error('ST tiada downloadUrl');

    const buffer = await downloadBufferFromUrl(dlUrl);
    return { buffer, source: 'YouTube' };
}

// =========================================================================
// 2. SAAVN (Lagu rasmi penuh bervokal, laju, tiada bot-check YouTube)
// =========================================================================
async function downloadViaSaavn(query) {
    const searchUrl = `https://saavn.dev/api/search/songs?query=${encodeURIComponent(query)}&limit=5`;
    const res = await fetch(searchUrl, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) throw new Error(`Saavn HTTP ${res.status}`);
    const json = await res.json();
    const results = json?.data?.results || [];
    const song = results.find(s =>
        Array.isArray(s?.downloadUrl) &&
        s.downloadUrl.length > 0 &&
        (!s.duration || Number(s.duration) <= MAX_DURATION_SEC)
    );
    if (!song) throw new Error('Saavn tiada lagu');

    // Pilih kualiti 160kbps atau tertinggi yang ada
    const urls = song.downloadUrl;
    const picked = urls.find(u => u.quality === '160kbps') || urls[urls.length - 1];
    if (!picked?.url) throw new Error('Saavn tiada URL');

    const title = song.name || query;
    const buffer = await processMp3WithWatermark(picked.url, title, ['-user_agent', UA]);
    return {
        buffer,
        title,
        timestamp: song.duration ? formatDuration(Number(song.duration)) : '-',
        source: 'Saavn',
    };
}

// =========================================================================
// 3. YTDL-CORE (Sokong YT_COOKIES dari Render Environment jika diset)
// =========================================================================
async function downloadViaYtdl(videoUrl, title) {
    if (!videoUrl) throw new Error('Tiada URL YouTube');
    const opts = {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: 1 << 25,
    };

    if (process.env.YT_COOKIES) {
        try {
            const parsed = JSON.parse(process.env.YT_COOKIES);
            if (Array.isArray(parsed)) {
                opts.agent = ytdl.createAgent(parsed);
            }
        } catch {
            // Abaikan jika format JSON cookies tidak sah
        }
    }

    const stream = ytdl(videoUrl, opts);
    const buffer = await processMp3WithWatermark(stream, title);
    return { buffer, source: 'YouTube' };
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

        const errors = [];
        let video = null;

        try {
            try {
                const searchRes = await yts(query);
                const vids = (searchRes?.videos || []).filter(v => v.seconds > 30 && v.seconds <= MAX_DURATION_SEC);
                video = vids.find(v => !isUnwantedVersion(v.title, query)) || vids[0] || null;
            } catch (e) {
                errors.push(`YTS:${e?.message || 'err'}`);
            }

            const lyricsPromise = fetchLyrics(query).then(res =>
                res || (video?.title ? fetchLyrics(sanitizeFilename(video.title)) : null)
            );

            let result = null;
            const attempts = [
                ['ST', () => downloadViaSaveTube(video?.url)],
                ['SVN', () => downloadViaSaavn(query)],
                ['YTDL', () => downloadViaYtdl(video?.url, video?.title || query)],
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

            const finalTitle = result.title || video?.title || query;
            const finalDuration = result.timestamp || video?.timestamp || '-';
            const cleanTitle = sanitizeFilename(finalTitle);
            const watermarkedName = `${cleanTitle} Airi's Corner.mp3`;

            await sock.sendMessage(
                jid,
                {
                    audio: result.buffer,
                    mimetype: 'audio/mpeg',
                    ptt: false,
                    fileName: watermarkedName,
                },
                { quoted: m }
            );

            const lyrics = await lyricsPromise;
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
                { text: `❌ Gagal muat turun lagu buat masa ni.\n_Debug: ${String(err?.message || err).slice(0, 180)}_` },
                { quoted: m }
            );
        }
    },
};
