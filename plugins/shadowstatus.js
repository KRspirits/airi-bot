import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

// Konfigurasi binary FFmpeg untuk Render
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
    description: 'Mampatkan video WhatsApp Status kualiti HD tanpa pecah',

    async execute({ sock, m, args }) {
        const isQuotedVideo = m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage;
        const isDirectVideo = m.message?.videoMessage;

        if (!isDirectVideo && !isQuotedVideo) {
            return sock.sendMessage(m.key.remoteJid, {
                text: '❌ *Sila reply video* atau *hantar video bersama kapsyen* `.shadowstatus` atau `.hd`'
            }, { quoted: m });
        }

        const jid = m.key.remoteJid;
        await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

        const tempDir = process.env.RENDER ? '/tmp' : __dirname;
        const timestamp = Date.now();
        const tempIn = path.join(tempDir, `in_${timestamp}.mp4`);
        const tempOut = path.join(tempDir, `out_${timestamp}.mp4`);

        try {
            let mediaToDownload = isQuotedVideo 
                ? { message: { videoMessage: isQuotedVideo } } 
                : m;

            const buffer = await downloadMediaMessage(mediaToDownload, 'buffer', {});
            fs.writeFileSync(tempIn, buffer);

            await compressVideo(tempIn, tempOut);

            await sock.sendMessage(jid, {
                video: fs.readFileSync(tempOut),
                caption: '⚡ *ShadowStatus HD Berjaya Diproses!*\n\nFormat video telah dioptimumkan untuk WhatsApp Status tanpa pecah.'
            }, { quoted: m });

            await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });

        } catch (error) {
            console.error('[ShadowStatus Error]:', error);
            await sock.sendMessage(jid, { text: '❌ Ralat ketika memproses video.' }, { quoted: m });
            await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        } finally {
            if (fs.existsSync(tempIn)) fs.unlinkSync(tempIn);
            if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut);
        }
    }
};
