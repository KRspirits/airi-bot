import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

ffmpeg.setFfmpegPath(ffmpegPath);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function renderTargetHD(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .outputOptions([
                '-c:v libx264',
                '-profile:v high',
                '-level 4.1',
                '-pix_fmt yuv420p',
                '-preset fast',
                '-crf 17',
                '-maxrate 5000k',
                '-bufsize 8000k',
                '-r 30',
                "-vf scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black,setsar=1",
                '-c:a aac',
                '-b:a 128k',
                '-ar 44100',
                '-t 30',
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
    desc: 'Hasilkan fail video HD untuk WhatsApp Status tanpa mampatan transit',

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
        const tempOut = path.join(tempDir, `hd_${timestamp}.mp4`);

        try {
            const mediaSource = isQuotedVideo 
                ? { message: { videoMessage: isQuotedVideo } } 
                : m;

            const buffer = await downloadMediaMessage(mediaSource, 'buffer', {});
            fs.writeFileSync(tempIn, buffer);

            await renderTargetHD(tempIn, tempOut);
            const videoBuffer = fs.readFileSync(tempOut);

            // Hantar SEBAGAI DOKUMEN (Kunci utama: WhatsApp Server dilarang kompres fail dokumen)
            await sock.sendMessage(jid, {
                document: videoBuffer,
                mimetype: 'video/mp4',
                fileName: `Status_HD_${timestamp}.mp4`,
                caption: '✅ *Fail Video HD Siap!*\n\n📌 *Langkah Wajib Supaya Jelas:*\n1. Tekan pada dokumen ini dan pilih **Save to Gallery / Simpan ke Galeri**.\n2. Buka Status WhatsApp > Pilih video tadi.\n3. **Tekan ikon [HD]** di bahagian atas skrin sebelum tekan Send.'
            }, { quoted: m });

            await sock.sendMessage(jid, { react: { text: '✅', key: m.key } }).catch(() => {});

        } catch (error) {
            console.error('[HD ERROR]:', error);
            await sock.sendMessage(jid, { text: '❌ Ralat ketika memproses fail video.' }, { quoted: m });
            await sock.sendMessage(jid, { react: { text: '❌', key: m.key } }).catch(() => {});
        } finally {
            if (fs.existsSync(tempIn)) fs.unlinkSync(tempIn);
            if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut);
        }
    }
};
