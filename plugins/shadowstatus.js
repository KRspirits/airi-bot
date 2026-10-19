import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

// Konfigurasi binary static FFmpeg untuk Linux Render
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
    name: 'hd',
    aliases: ['shadowstatus', 'purestatus'],
    category: 'tools',
    desc: 'Mampatkan video kualiti HD WhatsApp Status',

    async execute({ sock, m, user, db, args }) {
        const jid = m.key.remoteJid;
        console.log(`[SHADOWSTATUS] Menerima proses kompresi daripada ${jid}`);

        // Semak sama ada quoted video atau direct video
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const isQuotedVideo = quoted?.videoMessage;
        const isDirectVideo = m.message?.videoMessage;

        if (!isDirectVideo && !isQuotedVideo) {
            return sock.sendMessage(jid, {
                text: '⚠️ *Cara Guna:*\nReply mana-mana video dengan `.hd` atau hantar video bersama kapsyen `.hd`'
            }, { quoted: m });
        }

        // Reaksi tanda mula memproses
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

            await compressVideo(tempIn, tempOut);

            await sock.sendMessage(jid, {
                video: fs.readFileSync(tempOut),
                caption: '⚡ *ShadowStatus HD Berjaya Diproses!*\n\nVideo telah dioptimumkan khas untuk WhatsApp Status tanpa pecah. Sila download dan upload ke status anda.'
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
