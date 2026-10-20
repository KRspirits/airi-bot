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
    // Status WhatsApp ialah menegak 9:16. Sasaran 1080x1920 supaya WhatsApp ada banyak data untuk dimampatkan.
    // Video landskap dimuatkan dalam kanvas 1080x1920 (letterbox hitam), tanpa potong kandungan.
    // Video kecil TIDAK dibesarkan lebih daripada sumber asal untuk elak kualiti palsu.
    const vf = "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1";
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .outputOptions([
                '-c:v', 'libx264',
                '-profile:v', 'high',
                '-level', '4.2',
                '-pix_fmt', 'yuv420p',
                '-preset', 'medium',
                '-crf', '18',
                '-maxrate', '6000k',
                '-bufsize', '12000k',
                '-r', '30',
                '-vf', vf,
                '-c:a', 'aac',
                '-b:a', '128k',
                '-ar', '44100',
                '-movflags', '+faststart'
            ])
            .save(outputPath)
            .on('end', () => resolve(outputPath))
            .on('error', (err) => reject(err));
    });
}

export default {
    name: 'shadowstatus',
    alias: ['hd', 'purestatus'],
    category: 'tools',
    desc: 'Mampatkan video kualiti HD sebenar untuk WhatsApp Status',

    async execute({ sock, m, args }) {
        const jid = m.key.remoteJid;
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const isQuotedVideo = quoted?.videoMessage;
        const isDirectVideo = m.message?.videoMessage;

        if (!isDirectVideo && !isQuotedVideo) {
            return sock.sendMessage(jid, {
                text: '⚠️ Sila reply mana-mana video dengan `.shadowstatus` atau hantar video bersama kapsyen `.shadowstatus`'
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

            let videoBuffer;
            try {
                await compressVideo(tempIn, tempOut);
                videoBuffer = fs.readFileSync(tempOut);
                console.log('[SHADOWSTATUS] mampatan siap', videoBuffer.length, 'bait');
            } catch (encErr) {
                console.error('[SHADOWSTATUS] mampatan gagal, hantar asal:', encErr.message);
                videoBuffer = buffer;
            }

            // 1. Hantar video HD kepada pengguna
            await sock.sendMessage(jid, {
                document: videoBuffer, mimetype: 'video/mp4', fileName: 'airi_shadowstatus_hd.mp4',
                caption: '⚡ *ShadowStatus HD Sedia!*\n\n💡 *Tips Elak Kabur:*\nSemasa upload ke Status di WhatsApp, pastikan anda tekan ikon *HD* di bahagian atas skrin sebelum tekan hantar.'
            }, { quoted: m });

            // Sengaja TIDAK auto-post ke Status. Ia akan jadi status akaun bot, dan WhatsApp mampatkan semula bila muat naik.
            // Simpan fail dokumen ini, kemudian upload dari galeri ke Status dan tekan HD.
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
