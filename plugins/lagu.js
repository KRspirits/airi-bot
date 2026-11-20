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

// Elak terambil versi instrumental / karaoke / remix kecuali pengguna memang taip perkataan tu
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

// Tambah watermark ID3 metadata (Title + Artist Airi's Corner) & pastikan format MP3 bersih
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

async function downloadBufferFromUrl(url) {
    const res = await fetch(url, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(45000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 15000) throw new Error('Fail audio terlalu kecil');
    return buf;
}

// =========================================================================
// 1. YOUTUBE VIA OCEANSAVER / LOADER.TO (Lagu rasmi ada vokal, tak kena block IP Render)
// =========================================================================
async function downloadViaOceanSaver(videoUrl, title) {
    if (!videoUrl) throw new Error('Tiada URL YouTube');
    const initUrl = `https://p.oceansaver.in/ajax/download.php?copyright=0&format=mp3&url=${encodeURIComponent(videoUrl)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`;
    const initRes = await fetch(initUrl, {
        headers: { 'User-Agent': UA, 'Referer': 'https://loader.to/' },
        signal: AbortSignal.timeout(15000),
    });
    if (!initRes.ok) throw new Error(`OS init HTTP ${initRes.status}`);
    const initData = await initRes.json();
    if (!initData?.success || !initData?.id) throw new Error('OS tiada job ID');

    const progressUrl = `https://p.oceansaver.in/ajax/progress.php?id=${encodeURIComponent(initData.id)}`;
    for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 1500));
        const pRes = await fetch(progressUrl, {
            headers: { 'User-Agent': UA, 'Referer': 'https://loader.to/' },
            signal: AbortSignal.timeout(12000),
        });
        if (!pRes.ok) continue;
        const pData = await pRes.json();
        if (pData?.download_url) {
            const rawBuf = await downloadBufferFromUrl(pData.download_url);
            return { buffer: rawBuf, source: 'YouTube' };
        }
        if (pData?.success === 0 && pData?.text && /error|fail/i.test(pData.text)) {
            throw new Error(`OS ${pData.text}`);
        }
    }
    throw new Error('OS timeout');
}

// =========================================================================
// 2. SOUNDCLOUD (Tapis instrumental/remix & sertakan track_authorization)
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
    const searchUrl = `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(query)}&client_id=${clientId}&limit=15`;
    const res = await fetch(searchUrl, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) {
        if (res.status === 401 || res.status === 403) cachedScClientId = '';
        throw new Error(`SC search HTTP ${res.status}`);
    }
    const data = await res.json();
    const allValid = (data?.collection || []).filter(t =>
        t?.media?.transcodings?.length > 0 &&
        t.policy !== 'SNIP' &&
        t.policy !== 'BLOCK' &&
        (t.duration || 0) >= 60000 &&
        (t.duration || 0) <= MAX_DURATION_SEC * 1000
    );

    // Utamakan track yang bukan instrumental/karaoke
    const tracks = [
        ...allValid.filter(t => !isUnwantedVersion(t.title, query)),
        ...allValid.filter(t => isUnwantedVersion(t.title, query)),
    ];

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
                    buffer = await downloadBufferFromUrl(mediaJson.url);
                } else {
                    buffer = await processMp3WithWatermark(mediaJson.url, track.title || query, ['-user_agent', UA]);
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
// 3. YTDL-CORE (Backup terakhir)
// =========================================================================
async function downloadViaYtdl(videoUrl, title) {
    if (!videoUrl) throw new Error('Tiada URL YouTube');
    const stream = ytdl(videoUrl, {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: 1 << 25,
    });
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
            // Cari lagu di YouTube & tapis versi instrumental/karaoke
            try {
                const searchRes = await yts(query);
                const vids = (searchRes?.videos || []).filter(v => v.seconds > 30 && v.seconds <= MAX_DURATION_SEC);
                video = vids.find(v => !isUnwantedVersion(v.title, query)) || vids[0] || null;
            } catch (e) {
                errors.push(`YTS:${e?.message || 'err'}`);
            }

            // Cari lirik serentak di latar belakang
            const lyricsPromise = fetchLyrics(query).then(res =>
                res || (video?.title ? fetchLyrics(sanitizeFilename(video.title)) : null)
            );

            // Utamakan YouTube (OceanSaver) dulu supaya dapat lagu rasmi bervokal
            let result = null;
            const attempts = [
                ['YT', () => downloadViaOceanSaver(video?.url, video?.title || query)],
                ['SC', () => downloadViaSoundCloud(query)],
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

            const finalTitle = video?.title || result.title || query;
            const finalDuration = video?.timestamp || result.timestamp || '-';
            const cleanTitle = sanitizeFilename(finalTitle);
            const watermarkedName = `${cleanTitle} Airi's Corner.mp3`;

            // Hantar sebagai audio player terus (ikon headphone oren)
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
