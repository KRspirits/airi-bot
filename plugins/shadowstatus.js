import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

// Konfigurasi binary FFmpeg untuk persekitaran Linux Render
ffmpeg.setFfmpegPath(ffmpegPath);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function compressVideo(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .outputOptions([
                '-c:v libx264',
                '-profile:v high',
                '-level 4.0',
                '-pix_fmt yuv420p',
                '-preset faster',
                '-crf 22',
                '-maxrate 2800k',
                '-bufsize 5000k',
                '-r 30',
                '-vf scale=-2:min(ih\\,720)',
                '-c:a aac',
                '-b:a 128k',
                '-movflags +faststart'
            ])
            .save(outputPath)
            .on('end', () => resolve(outputPath))
            .on('error', (err) => reject(err));
    });
}

export default {
    name: 'ShadowStatus HD',
    command: ['shadowstatus', 'hd'],
    category: 'tools',
    description: 'Mampatkan video WhatsApp Status HD tanpa pecah',

    async execute({ sock, m, user, db, args }) {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const isQuotedVideo = quoted?.videoMessage;
        const isDirectVideo = m.message?.videoMessage;

        if (!isDirectVideo && !isQuotedVideo) {
            return sock.sendMessage(m.key.remoteJid, {
                text: '❌ Sila hantar video bersama kapsyen *.hd* atau reply mana-mana video dengan *.hd*'
            }, { quoted: m });
        }

        const jid = m.key.remoteJid;
        await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } }).catch(() => {});

        // Gunakan direktori /tmp untuk persekitaran Linux Render
        const tempDir = process.env.RENDER ? '/tmp' : __dirname;
        const timestamp = Date.now();
        const tempIn = path.join(tempDir, `in_${timestamp}.mp4`);
        const tempOut = path.join(tempDir, `out_${timestamp}.mp4`);

        try {
            let mediaToDownload;
            if (isQuotedVideo) {
                mediaToDownload = {
                    message: {
                        videoMessage: isQuotedVideo
                    }
                };
            } else {
                mediaToDownload = m;
            }

            const buffer = await downloadMediaMessage(mediaToDownload, 'buffer', {});
            fs.writeFileSync(tempIn, buffer);

            await compressVideo(tempIn, tempOut);

            await sock.sendMessage(jid, {
                video: fs.readFileSync(tempOut),
                caption: '⚡ *ShadowStatus HD Sedia!*\n\nVideo telah dioptimumkan untuk WhatsApp Status. Muat turun video ini dan pos terus ke status anda.'
            }, { quoted: m });

            await sock.sendMessage(jid, { react: { text: '✅', key: m.key } }).catch(() => {});

        } catch (error) {
            console.error('[ShadowStatus Error]:', error);
            await sock.sendMessage(jid, { text: '❌ Ralat ketika memproses video status.' }, { quoted: m });
            await sock.sendMessage(jid, { react: { text: '❌', key: m.key } }).catch(() => {});
        } finally {
            if (fs.existsSync(tempIn)) fs.unlinkSync(tempIn);
            if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut);
        }
    }
};
