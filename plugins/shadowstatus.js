import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

ffmpeg.setFfmpegPath(ffmpegPath);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function renderOptimizedTarget(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .outputOptions([
                // Enkoder asas yang disukai enjin transcode WhatsApp
                '-c:v libx264',
                '-profile:v baseline',
                '-level 3.0',
                '-pix_fmt yuv420p',
                '-preset ultrafast',

                // Hadkan kadar bit tepat pada siling pemampat WhatsApp
                // Jika bitrate terlalu tinggi, WhatsApp akan hancurkan kualiti
                '-b:v 1100k',
                '-maxrate 1200k',
                '-bufsize 1500k',

                // Kunci 30fps dan susunan keyframe pendek
                '-r 30',
                '-g 30',
                '-keyint_min 30',
                '-sc_threshold 0',

                // Skala 720p tegak + Penapis Penajaman (Unsharp Mask)
                // Penapis ini menaikkan kontras garisan supaya apabila WhatsApp mampatkan, butiran kekal kelihatan
                "-vf scale=720:-2:force_original_aspect_ratio=decrease,unsharp=luma_msize_x=5:luma_msize_y=5:luma_amount=1.5",

                // Audio
                '-c:a aac',
                '-b:a 64k',
                '-ar 44100',
                '-ac 1',

                // Hadkan durasi kepada 29 saat (elak pemotongan automatik Meta)
                '-t 29',
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
    desc: 'Optimumkan video untuk mengurangkan kekaburan Status WhatsApp',

    async execute({ sock, m, user, db, args }) {
        const jid = m.key.remoteJid;
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const isQuotedVideo = quoted?.videoMessage;
        const isDirectVideo = m.message?.videoMessage;

        if (!isDirectVideo && !isQuotedVideo) {
            return sock.sendMessage(jid, {
                text: '⚠️ *Cara Guna:*\nReply video (bawah 30s) dengan `.hd`'
            }, { quoted: m });
        }

        await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } }).catch(() => {});

        const tempDir = process.env.RENDER ? '/tmp' : __dirname;
        const timestamp = Date.now();
        const tempIn = path.join(tempDir, `raw_${timestamp}.mp4`);
        const tempOut = path.join(tempDir, `opt_${timestamp}.mp4`);

        try {
            const mediaSource = isQuotedVideo 
                ? { message: { videoMessage: isQuotedVideo } } 
                : m;

            const buffer = await downloadMediaMessage(mediaSource, 'buffer', {});
            fs.writeFileSync(tempIn, buffer);

            await renderOptimizedTarget(tempIn, tempOut);
            const videoBuffer = fs.readFileSync(tempOut);

            // Hantar video yang telah dioptimumkan
            await sock.sendMessage(jid, {
                video: videoBuffer,
                caption: '✅ *Video Sedia!*\n\n📲 *Cara Muat Naik Terbaik:*\n1. Tekan butang **Forward (Anak Panah Kanan)** di sebelah video ini > Pilih **Status Saya**.\n2. Jika anda simpan ke telefon dan muat naik manual dari galeri, pastikan anda menekan ikon **[HD]** di bar atas editor Status WhatsApp sebelum menghantar.'
            }, { quoted: m });

            await sock.sendMessage(jid, { react: { text: '✅', key: m.key } }).catch(() => {});

        } catch (error) {
            console.error('[OPTIMIZER ERROR]:', error);
            await sock.sendMessage(jid, { text: '❌ Ralat ketika memproses video.' }, { quoted: m });
            await sock.sendMessage(jid, { react: { text: '❌', key: m.key } }).catch(() => {});
        } finally {
            if (fs.existsSync(tempIn)) fs.unlinkSync(tempIn);
            if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut);
        }
    }
};
