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

async function downloadBufferFromUrl(url) {
    const res = await fetch(url, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(45000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const arrBuf = await res.arrayBuffer();
    const buf = Buffer.from(arrBuf);
    if (buf.length < 15000) throw new Error('Fail audio terlalu kecil / rosak');
    return buf;
}

// Cuba beberapa API ytmp3 percuma (elak IP Render kena block oleh YouTube)
async function downloadViaApis(videoUrl) {
    const providers = [
        async () => {
            const r = await fetch(`https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(videoUrl)}`, {
                headers: { 'User-Agent': UA },
                signal: AbortSignal.timeout(20000),
            });
            const j = await r.json();
            const dl = j?.data?.dl || j?.data?.download || j?.result?.download;
            if (!dl) throw new Error('Tiada pautan (siputzx)');
            return downloadBufferFromUrl(dl);
        },
        async () => {
            const r = await fetch(`https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(videoUrl)}`, {
                headers: { 'User-Agent': UA },
                signal: AbortSignal.timeout(20000),
            });
            const j = await r.json();
            const dl = j?.result?.download?.url || j?.result?.url;
            if (!dl) throw new Error('Tiada pautan (vreden)');
            return downloadBufferFromUrl(dl);
        },
        async () => {
            const r = await fetch(`https://api.ryzendesu.vip/api/downloader/ytmp3?url=${encodeURIComponent(videoUrl)}`, {
                headers: { 'User-Agent': UA },
                signal: AbortSignal.timeout(20000),
            });
            const j = await r.json();
            const dl = j?.url || j?.data?.url;
            if (!dl) throw new Error('Tiada pautan (ryzendesu)');
            return downloadBufferFromUrl(dl);
        },
        async () => {
            const r = await fetch(`https://api.agatz.xyz/api/ytmp3?url=${encodeURIComponent(videoUrl)}`, {
                headers: { 'User-Agent': UA },
                signal: AbortSignal.timeout(20000),
            });
            const j = await r.json();
            const dl = j?.data?.downloadUrl || j?.data?.url || j?.data?.[0]?.downloadUrl;
            if (!dl) throw new Error('Tiada pautan (agatz)');
            return downloadBufferFromUrl(dl);
        },
    ];

    let lastErr;
    for (const run of providers) {
        try {
            return await run();
        } catch (e) {
            lastErr = e;
        }
    }
    throw lastErr || new Error('Semua API gagal');
}

function downloadViaYtdl(videoUrl) {
    return new Promise((resolve, reject) => {
        const tempFile = path.join(os.tmpdir(), `airi_lagu_${Date.now()}_${Math.random().toString(36).slice(2)}.mp3`);
        const stream = ytdl(videoUrl, {
            filter: 'audioonly',
            quality: 'highestaudio',
            highWaterMark: 1 << 25,
        });

        stream.on('error', err => {
            try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch {}
            reject(err);
        });

        ffmpeg(stream)
            .audioBitrate(128)
            .toFormat('mp3')
            .on('error', err => {
                try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch {}
                reject(err);
            })
            .on('end', () => {
                try {
                    const buf = fs.readFileSync(tempFile);
                    fs.unlinkSync(tempFile);
                    resolve(buf);
                } catch (e) {
                    reject(e);
                }
            })
            .save(tempFile);
    });
}

async function getAudioBuffer(videoUrl) {
    try {
        return await downloadViaApis(videoUrl);
    } catch (apiErr) {
        console.warn('[LAGU API FALLBACK]', apiErr?.message || apiErr);
        return await downloadViaYtdl(videoUrl);
    }
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

        try {
            const searchRes = await yts(query);
            const video = searchRes?.videos?.[0];

            if (!video) {
                return sock.sendMessage(
                    jid,
                    { text: `❌ Lagu *${query}* tak dijumpai.` },
                    { quoted: m }
                );
            }

            if (video.seconds > MAX_DURATION_SEC) {
                return sock.sendMessage(
                    jid,
                    { text: `⚠️ Lagu terlalu panjang (${video.timestamp}). Had maksimum ialah 10 minit.` },
                    { quoted: m }
                );
            }

            const cleanTitle = sanitizeFilename(video.title);
            const watermarkedName = `${cleanTitle} Airi's Corner.mp3`;

            // Muat turun audio & cari lirik serentak
            const [audioBuffer, lyrics] = await Promise.all([
                getAudioBuffer(video.url),
                fetchLyrics(query).then(res => res || fetchLyrics(cleanTitle)),
            ]);

            // Hantar sebagai dokumen audio/mpeg supaya nama fail watermark kelihatan jelas di WhatsApp
            await sock.sendMessage(
                jid,
                {
                    document: audioBuffer,
                    mimetype: 'audio/mpeg',
                    fileName: watermarkedName,
                    caption: `🎧 *${video.title}*\n⏱️ Durasi: ${video.timestamp}\n✨ _Airi's Corner_`,
                },
                { quoted: m }
            );

            // Hantar lirik dalam bentuk teks
            if (lyrics) {
                const maxLen = 3800;
                const teksLirik = lyrics.length > maxLen ? `${lyrics.slice(0, maxLen)}\n\n...(lirik dipendekkan)` : lyrics;
                await sock.sendMessage(
                    jid,
                    { text: `📝 *Lirik: ${video.title}*\n\n${teksLirik}` },
                    { quoted: m }
                );
            } else {
                await sock.sendMessage(
                    jid,
                    { text: `📝 *${video.title}*\n_(Lirik teks tak dijumpai untuk lagu ni)_` },
                    { quoted: m }
                );
            }
        } catch (err) {
            console.error('[LAGU ERROR]', err?.message || err);
            await sock.sendMessage(
                jid,
                { text: '❌ Gagal muat turun lagu buat masa ni. Cuba tajuk lain atau cuba lagi sekejap ya.' },
                { quoted: m }
            );
        }
    },
};
