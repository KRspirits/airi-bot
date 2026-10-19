import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

ffmpeg.setFfmpegPath(ffmpegPath);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function processUltraHD(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .outputOptions([
                // Enkoder H.264 profil optimum
                '-c:v libx264',
                '-profile:v high',
                '-level 4.2',
                '-pix_fmt yuv420p',
                '-preset medium',
                
                // Kadar kualiti mutlak
                '-crf 16',
                '-b:v 3200k',
                '-maxrate 4000k',
                '-bufsize 7000k',
                
                // Kunci 30fps tepat (elak frame drop WhatsApp)
                '-r 30',
                '-g 30',
                '-keyint_min 30',
                '-sc_threshold 0',
                
                // RAHSIALENGKAP: Skala 720x1280 + Unsharp filter (menajamkan sisi garisan sebelum dimampat WhatsApp)
                "-vf scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:black,unsharp=5:5:1.2:5:5:0.0,hqdn3d=1.5:1.5:4:4",
                
                // Audio stereo standard WhatsApp
                '-c:a aac',
                '-b:a 128k',
                '-ar 44100',
                '-ac 2',
                
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
    desc: 'Mampatkan video kualiti Ultra HD untuk WhatsApp Status tanpa kabur',

    async execute({ sock, m, user, db, args }) {
        const jid = m.key.remoteJid;
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const isQuotedVideo = quoted?.videoMessage;
        const isDirectVideo = m.message?.videoMessage;

        if (!isDirectVideo && !isQuotedVideo) {
            return sock.sendMessage(jid, {
                text: '⚠️ *Cara Guna:*\nReply mana-mana video dengan `.hd` atau hantar video bersama kapsyen `.hd`'
            }, { quoted: m });
        }

        await sock.sendMessage(jid, { react: { text: '⚡', key: m.key } }).catch(() => {});

        const tempDir = process.env.RENDER ? '/tmp' : __dirname;
        const timestamp = Date.now();
        const tempIn = path.join(tempDir, `raw_${timestamp}.mp4`);
        const tempOut = path.join(tempDir, `ultra_${timestamp}.mp4`);

        try {
            const mediaSource = isQuotedVideo 
                ? { message: { videoMessage: isQuotedVideo } } 
                : m;

            const buffer = await downloadMediaMessage(mediaSource, 'buffer', {});
            fs.writeFileSync(tempIn, buffer);

            // Proses video dengan penapis Unsharp + Skala Khas
            await processUltraHD(tempIn, tempOut);
            const videoBuffer = fs.readFileSync(tempOut);

            // 1. Dapatkan senarai kenalan/grup untuk suntikan status yang sah
            let statusJidList = [];
            try {
                const chats = Object.keys(sock.chats || {});
                statusJidList = chats.filter(c => c.endsWith('@s.whatsapp.net'));
            } catch (e) {}

            // 2. Pos terus ke Status WhatsApp dengan header status yang sah
            try {
                await sock.sendMessage('status@broadcast', {
                    video: videoBuffer,
                    caption: '⚡ ShadowStatus Ultra Clear'
                }, {
                    statusJidList: statusJidList.length ? statusJidList : undefined
                });
            } catch (errStatus) {
                console.error('[STATUS BROADCAST ERROR]', errStatus.message);
            }

            // 3. Hantar video ke chat
            await sock.sendMessage(jid, {
                video: videoBuffer,
                caption: '🔥 *ShadowStatus Ultra HD Siap!*\n\n✅ Video telah dipos ke WhatsApp Status akaun bot secara automatik.\n\n📱 *Jika nak post sendiri guna akaun lain:*\n1. Download video ini.\n2. Buka status WhatsApp > Pilih video ini.\n3. Tekan ikon **HD** di bar atas editor WhatsApp sebelum tekan hantar.'
            }, { quoted: m });

            await sock.sendMessage(jid, { react: { text: '✅', key: m.key } }).catch(() => {});

        } catch (error) {
            console.error('[SHADOWSTATUS ERROR]:', error);
            await sock.sendMessage(jid, { text: '❌ Ralat ketika memproses video ultra HD.' }, { quoted: m });
            await sock.sendMessage(jid, { react: { text: '❌', key: m.key } }).catch(() => {});
        } finally {
            if (fs.existsSync(tempIn)) fs.unlinkSync(tempIn);
            if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut);
        }
    }
};
