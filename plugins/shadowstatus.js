import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

ffmpeg.setFfmpegPath(ffmpegPath);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function renderPureStatusEngine(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .outputOptions([
                // Codec h264 Baseline/Main (paling mesra WhatsApp engine)
                '-c:v libx264',
                '-profile:v main',
                '-level 3.1',
                '-pix_fmt yuv420p',
                
                // Formula PureStatus: CBR Bitrate Ketat (di bawah had WhatsApp transcode)
                '-b:v 1400k',
                '-minrate 1400k',
                '-maxrate 1400k',
                '-bufsize 2800k',
                
                // Kunci 30 fps tepat
                '-r 30',
                '-g 30',
                '-keyint_min 30',
                '-sc_threshold 0',
                
                // Resolusi tepat 720x1280 (nisbah 9:16 standard WhatsApp)
                "-vf scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:black,setsar=1",
                
                // Audio optimum WhatsApp
                '-c:a aac',
                '-b:a 64k',
                '-ar 44100',
                '-ac 2',
                
                // Faststart metadata streaming
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
    desc: 'Proses video format PureStatus untuk di-forward ke Status WhatsApp',

    async execute({ sock, m, user, db, args }) {
        const jid = m.key.remoteJid;
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const isQuotedVideo = quoted?.videoMessage;
        const isDirectVideo = m.message?.videoMessage;

        if (!isDirectVideo && !isQuotedVideo) {
            return sock.sendMessage(jid, {
                text: '⚠️ *Cara Guna:*\nReply video dengan `.hd` atau hantar video bersama kapsyen `.hd`'
            }, { quoted: m });
        }

        await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } }).catch(() => {});

        const tempDir = process.env.RENDER ? '/tmp' : __dirname;
        const timestamp = Date.now();
        const tempIn = path.join(tempDir, `raw_${timestamp}.mp4`);
        const tempOut = path.join(tempDir, `pure_${timestamp}.mp4`);

        try {
            const mediaSource = isQuotedVideo 
                ? { message: { videoMessage: isQuotedVideo } } 
                : m;

            const buffer = await downloadMediaMessage(mediaSource, 'buffer', {});
            fs.writeFileSync(tempIn, buffer);

            // Proses menggunakan algoritma PureStatus Target Profile
            await renderPureStatusEngine(tempIn, tempOut);
            const videoBuffer = fs.readFileSync(tempOut);

            // Hantar video terus ke chat (untuk diforward)
            await sock.sendMessage(jid, {
                video: videoBuffer,
                caption: '✅ *Video PureStatus Sedia!*\n\n📲 *Cara Jadikan Status Tanpa Pecah:*\n1. Tekan lama pada video ini (atau tekan ikon anak panah kanan/forward di sebelah video).\n2. Pilih **Forward (Teruskan)**.\n3. Pilih **My Status (Status Saya)**.\n\n*(Jangan save ke galeri lalu upload manual. Wajib gunakan butang FORWARD terus dari WhatsApp supaya fail tidak di-compress semula).*'
            }, { quoted: m });

            await sock.sendMessage(jid, { react: { text: '✅', key: m.key } }).catch(() => {});

        } catch (error) {
            console.error('[PURESTATUS ERROR]:', error);
            await sock.sendMessage(jid, { text: '❌ Ralat ketika memproses video.' }, { quoted: m });
            await sock.sendMessage(jid, { react: { text: '❌', key: m.key } }).catch(() => {});
        } finally {
            if (fs.existsSync(tempIn)) fs.unlinkSync(tempIn);
            if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut);
        }
    }
};
