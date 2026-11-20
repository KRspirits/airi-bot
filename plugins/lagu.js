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
// 1. SOUNDCLOUD (Sertakan track_authorization & cuba banyak track)
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
    const searchUrl = `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(query)}&client_id=${clientId}&limit=10`;
    const res = await fetch(searchUrl, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) {
        if (res.status === 401 || res.status === 403) cachedScClientId = '';
        throw new Error(`SC search HTTP ${res.status}`);
    }
    const data = await res.json();
    const tracks = (data?.collection || []).filter(t =>
        t?.media?.transcodings?.length > 0 &&
        t.policy !== 'SNIP' &&
        t.policy !== 'BLOCK' &&
        (t.duration || 0) >= 45000 &&
        (t.duration || 0) <= MAX_DURATION_SEC * 1000
    );

    if (!tracks.length) throw new Error('SC tiada full track');

    let lastErr = new Error('SC semua track gagal');
    for (const track of tracks.slice(0, 6)) {
        const transcodings = [
            ...track.media.transcodings.filter(t => t.format?.protocol === 'progressive'),
            ...track.media.transcodings.filter(t => t.format?.protocol === 'hls'),
        ];

        for (const chosen of transcodings) {
            if (!chosen?.url) continue;
            try {
                const u = new URL(chosen.url);
                u.searchParams.set('client_id', clientId);
                if (track.track_authorization) {
                    u.searchParams.set('track_authorization', track.track_authorization);
                }

                const mediaRes = await fetch(u.toString(), {
                    headers: {
                        'User-Agent': UA,
                        'Origin': 'https://soundcloud.com',
                        'Referer': 'https://soundcloud.com/',
                    },
                    signal: AbortSignal.timeout(12000),
                });
                if (!mediaRes.ok) {
                    lastErr = new Error(`SC media HTTP ${mediaRes.status}`);
                    continue;
                }

                const mediaJson = await mediaRes.json();
                if (!mediaJson?.url) continue;

                let buffer;
                if (chosen.format?.protocol === 'progressive') {
                    const audioRes = await fetch(mediaJson.url, {
                        headers: { 'User-Agent': UA },
                        signal: AbortSignal.timeout(40000),
                    });
                    if (!audioRes.ok) {
                        lastErr = new Error(`SC audio HTTP ${audioRes.status}`);
                        continue;
                    }
                    buffer = Buffer.from(await audioRes.arrayBuffer());
                    if (buffer.length < 15000) continue;
                } else {
                    buffer = await convertToMp3Buffer(mediaJson.url, ['-user_agent', UA]);
                }

                return {
                    buffer,
                    title: track.title || query,
                    timestamp: formatDuration((track.duration || 0) / 1000),
                    source: 'SoundCloud',
                };
            } catch (e) {
                lastErr = e;
            }
        }
    }
    throw lastErr;
}

// =========================================================================
// 2. AUDIUS (API rasmi percuma, terus dapat MP3, tak block IP Render)
// =========================================================================
async function downloadViaAudius(query) {
    const hostRes = await fetch('https://api.audius.co', {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(10000),
    });
    if (!hostRes.ok) throw new Error(`Audius host HTTP ${hostRes.status}`);
    const hostJson = await hostRes.json();
    const hosts = Array.isArray(hostJson?.data) ? hostJson.data.slice(0, 3) : [];
    if (!hosts.length) throw new Error('Audius tiada host');

    let lastErr = new Error('Audius gagal');
    for (const host of hosts) {
        try {
            const sRes = await fetch(
                `${host}/v1/tracks/search?query=${encodeURIComponent(query)}&app_name=AiriCorner`,
                { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(12000) }
            );
            if (!sRes.ok) throw new Error(`HTTP ${sRes.status}`);
            const sJson = await sRes.json();
            const track = (sJson?.data || []).find(t =>
                t?.id && (t.duration || 0) >= 45 && (t.duration || 0) <= MAX_DURATION_SEC
            );
            if (!track) throw new Error('Audius tiada lagu');

            const streamUrl = `${host}/v1/tracks/${encodeURIComponent(track.id)}/stream?app_name=AiriCorner`;
            const aRes = await fetch(streamUrl, {
                headers: { 'User-Agent': UA },
                signal: AbortSignal.timeout(40000),
            });
            if (!aRes.ok) throw new Error(`Audius stream HTTP ${aRes.status}`);
            const buffer = Buffer.from(await aRes.arrayBuffer());
            if (buffer.length < 15000) throw new Error('Audius audio terlalu kecil');

            return {
                buffer,
                title: track.title || query,
                timestamp: formatDuration(track.duration || 0),
                source: 'Audius',
            };
        } catch (e) {
            lastErr = e;
        }
    }
    throw lastErr;
}

// =========================================================================
// 3. YTDL-CORE (Backup terakhir)
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
            // Cari metadata di YouTube dulu (untuk tajuk yang cantik & lirik)
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

            // Cuba muat turun dari sumber yang mesra IP Render
            let result = null;
            const attempts = [
                ['SC', () => downloadViaSoundCloud(query)],
                ['AUD', () => downloadViaAudius(query)],
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

            const finalTitle = result.title || video?.title || query;
            const finalDuration = result.timestamp || video?.timestamp || '-';
            const cleanTitle = sanitizeFilename(finalTitle);
            const watermarkedName = `${cleanTitle} Airi's Corner.mp3`;

            // Hantar sebagai audio player terus (ikon headphone oren, boleh tekan play dalam chat)
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

            // Hantar info lagu + lirik dalam bentuk teks
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
