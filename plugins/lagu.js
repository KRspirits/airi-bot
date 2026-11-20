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

function downloadToMp3(videoUrl, outputPath) {
    return new Promise((resolve, reject) => {
        const stream = ytdl(videoUrl, {
            filter: 'audioonly',
            quality: 'highestaudio',
            highWaterMark: 1 << 25,
        });

        stream.on('error', reject);

        ffmpeg(stream)
            .audioBitrate(128)
            .toFormat('mp3')
            .on('error', reject)
            .on('end', () => resolve(outputPath))
            .save(outputPath);
    });
}

export default {
    name: 'lagu',
    aliases: ['song'],
    description: 'Cari lagu, hantar audio MP3 (watermark Airi\'s Corner) berserta lirik teks.',
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

        let tempFile = '';
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
            tempFile = path.join(os.tmpdir(), `airi_lagu_${Date.now()}_${Math.random().toString(36).slice(2)}.mp3`);

            // Muat turun audio & cari lirik serentak
            const [, lyrics] = await Promise.all([
                downloadToMp3(video.url, tempFile),
                fetchLyrics(query).then(res => res || fetchLyrics(cleanTitle)),
            ]);

            const audioBuffer = fs.readFileSync(tempFile);

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
            console.error('[LAGU ERROR]', err);
            await sock.sendMessage(
                jid,
                { text: '❌ Gagal muat turun lagu buat masa ni. Cuba tajuk lain atau cuba lagi sekejap ya.' },
                { quoted: m }
            );
        } finally {
            if (tempFile && fs.existsSync(tempFile)) {
                try { fs.unlinkSync(tempFile); } catch { /* abaikan */ }
            }
        }
    },
};
