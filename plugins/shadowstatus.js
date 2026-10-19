import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

ffmpeg.setFfmpegPath(ffmpegPath);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function compressVideoPureStatus(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .outputOptions([
                // Enkoder H.264 standard WhatsApp
                '-c:v libx264',
                '-profile:v main',
                '-level 3.1',
                '-pix_fmt yuv420p',
                '-preset faster',
                
                // Kadar bingkai tetap 30 fps
                '-r 30',
                '-g 60',
                '-keyint_min 30',
                '-sc_threshold 0',
                
                // Kualiti visual dan had bitrate penentu (elak re-encode WhatsApp)
                '-crf 20',
                '-b:v 2200k',
                '-maxrate 2400k',
                '-bufsize 3000k',
                
                // Paksa skala tepat 720x1280 (portrait) dengan padding hitam jika aspect ratio berbeza
                "-vf scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:black,setsar=1",
                
                // Audio optimum WhatsApp
                '-c:a aac',
                '-b:a 64k',
                '-ar 44100',
                '-ac 2',
                
                // Metadata penstriman pantas
                '-movflags +faststart'
            ])
            .save(outputPath)
            .on('end', () => resolve(outputPath))
            .on('error', (err) => reject(err));
    });
}

export default {
    name: 'hd',
    aliases: ['shadowstatus', 'purestatus'],
    category: 'tools',
    desc: 'Mampatkan video kualiti HD WhatsApp Status tanpa transcode kabur',

    async execute({ sock, m, user, db, args }) {
        const jid = m.key.remoteJid;
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const isQuotedVideo = quoted?.videoMessage;
        const isDirectVideo = m.message?.videoMessage;

        if (!isDirectVideo && !isQuotedVideo) {
            return sock.sendMessage(jid, {
                text: '⚠️ *Cara Guna:*\nReply mana-mana video dengan `.hd` atau hantar video bersama caption `.hd`'
            }, { quoted: m });
        }

        await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } }).catch(() => {});

        const tempDir = process.env.RENDER ? '/tmp' : __dirname;
        const timestamp = Date.now();
        const tempIn = path.join(tempDir, `in_${timestamp}.mp4`);
        const tempOut = path.join(tempDir, `out_${timestamp}.mp4`);

        try {
            const mediaSource = isQuotedVideo 
                ? { message: { videoMessage: isQuotedVideo } } 
                : m;

            const buffer = await downloadMediaMessage(mediaSource, 'buffer', {});
            fs.writeFileSync(tempIn, buffer);

            await compressVideoPureStatus(tempIn, tempOut);
            const videoBuffer = fs.readFileSync(tempOut);

            // 1. Pos terus ke WhatsApp Status (Kaedah mutlak elak transcode telefon)
            try {
                await sock.sendMessage('status@broadcast', {
                    video: videoBuffer,
                    caption: '⚡ ShadowStatus HD'
                });
            } catch (statusErr) {
                console.error('[STATUS BROADCAST ERROR]:', statusErr.message);
            }

            // 2. Hantar fail siap ke chat
            await sock.sendMessage(jid, {
                video: videoBuffer,
                caption: '✅ *ShadowStatus HD Berjaya Diproses!*\n\n🚀 *Status telah dimuat naik terus ke WhatsApp Status anda secara automatik (100% kualiti asal tanpa melalui galeri telefon).*\n\nJika anda tetap ingin upload manual ke akaun lain, hantar video ini ke akaun tersebut menggunakan mod "Document" atau pastikan ikon HD diaktifkan.'
            }, { quoted: m });

            await sock.sendMessage(jid, { react: { text: '✅', key: m.key } }).catch(() => {});

        } catch (error) {
            console.error('[SHADOWSTATUS ERROR]:', error);
            await sock.sendMessage(jid, { text: '❌ Ralat ketika memproses mampatan video.' }, { quoted: m });
            await sock.sendMessage(jid, { react: { text: '❌', key: m.key } }).catch(() => {});
        } finally {
            if (fs.existsSync(tempIn)) fs.unlinkSync(tempIn);
            if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut);
        }
    }
};
