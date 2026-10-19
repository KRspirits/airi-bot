import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

ffmpeg.setFfmpegPath(ffmpegPath);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function compressVideo(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .outputOptions([
                '-c:v libx264',
                '-profile:v high',
                '-level 4.1',
                '-pix_fmt yuv420p',
                '-preset slow',
                '-crf 19',
                '-maxrate 3500k',
                '-bufsize 6000k',
                '-r 30',
                // Penskalaan pintar: 720p mengikut orientasi (landscape vs portrait)
                "-vf scale='if(gt(iw,ih),-2,720)':'if(gt(iw,ih),720,-2)':force_original_aspect_ratio=decrease",
                '-c:a aac',
                '-b:a 128k',
                '-ar 44100',
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
    desc: 'Mampatkan video kualiti HD sebenar untuk WhatsApp Status',

    async execute({ sock, m, args }) {
        const jid = m.key.remoteJid;
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const isQuotedVideo = quoted?.videoMessage;
        const isDirectVideo = m.message?.videoMessage;

        if (!isDirectVideo && !isQuotedVideo) {
            return sock.sendMessage(jid, {
                text: '⚠️ Sila reply mana-mana video dengan `.hd` atau hantar video bersama kapsyen `.hd`'
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

            await compressVideo(tempIn, tempOut);
            const videoBuffer = fs.readFileSync(tempOut);

            // 1. Hantar video HD kepada pengguna
            await sock.sendMessage(jid, {
                video: videoBuffer,
                caption: '⚡ *ShadowStatus HD Sedia!*\n\n💡 *Tips Elak Kabur:*\nSemasa upload ke Status di WhatsApp, pastikan anda tekan ikon *HD* di bahagian atas skrin sebelum tekan hantar.'
            }, { quoted: m });

            // 2. Jika taip ".hd status", bot akan terus pos video ke WhatsApp Status akaun bot secara automatik
            if (args && args.includes('status')) {
                await sock.sendMessage('status@broadcast', {
                    video: videoBuffer,
                    caption: '⚡ Posted via ShadowStatus HD'
                });
                await sock.sendMessage(jid, { text: '✅ Video berjaya dimuat naik terus ke Status WhatsApp!' }, { quoted: m });
            }

            await sock.sendMessage(jid, { react: { text: '✅', key: m.key } }).catch(() => {});

        } catch (error) {
            console.error('[SHADOWSTATUS ERROR]:', error);
            await sock.sendMessage(jid, { text: '❌ Ralat ketika memproses video.' }, { quoted: m });
            await sock.sendMessage(jid, { react: { text: '❌', key: m.key } }).catch(() => {});
        } finally {
            if (fs.existsSync(tempIn)) fs.unlinkSync(tempIn);
            if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut);
        }
    }
};
