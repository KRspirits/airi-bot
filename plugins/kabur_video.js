import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { allow } from '../lib/cooldown.js';

// =========================================================================
// 🌫️ KABUR VIDEO - kabur video yang dihantar pengguna, hantar balik.
//   .kabur         -> kabur video (hantar video dengan caption .kabur, atau reply video)
//   .kabur_status  -> kabur & pos ke STATUS pemanggil SAHAJA (mesti guna sendiri)
// Had: video maks 30 saat, maks 16MB, output 540p, timeout 90 saat.
// Status: hanya bila pemanggil sendiri taip .kabur_status. Tak ada auto-post.
// Penerima status: env STATUS_AUDIENCE (senarai nombor dipisah koma) atau kenalan sedia ada.
// =========================================================================

const MAX_BYTES = 16 * 1024 * 1024;
const MAX_SECONDS = 30;
const TIMEOUT_MS = 90_000;
const busy = new Set(); // satu job setiap pengguna, jimat RAM Render (512MB)

// Kabur kuat tapi ringan: skala ke 540p dahulu, kemudian gblur.
const FILTER = 'scale=-2:540,gblur=sigma=18';

export function audienceFromEnv() {
    return (process.env.STATUS_AUDIENCE || '')
        .split(/[\s,]+/).map(s => s.replace(/\D/g, '')).filter(Boolean)
        .map(n => `${n}@s.whatsapp.net`);
}

/** Kabur video (Buffer -> Buffer). Lempar ralat jika ffmpeg gagal atau terlalu lama. */
export async function blurVideo(input) {
    // Tulis ke fail sementara: mp4 dengan moov di hujung tak boleh dibaca dari pipe (ffmpeg tak boleh seek).
    const { default: ffmpegPath } = await import('ffmpeg-static');
    const tmp = path.join(os.tmpdir(), 'kabur_' + crypto.randomBytes(6).toString('hex') + '.mp4');
    fs.writeFileSync(tmp, input);
    try {
        return await new Promise((resolve, reject) => {
            const args = ['-v', 'error', '-i', tmp, '-vf', FILTER, '-t', String(MAX_SECONDS),
                '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '30', '-pix_fmt', 'yuv420p',
                '-c:a', 'aac', '-b:a', '96k', '-movflags', 'frag_keyframe+empty_moov', '-f', 'mp4', 'pipe:1'];
            const p = spawn(ffmpegPath, args);
            const out = [], err = [];
            const timer = setTimeout(() => { p.kill('SIGKILL'); reject(new Error('timeout')); }, TIMEOUT_MS);
            p.stdout.on('data', d => out.push(d));
            p.stderr.on('data', d => err.push(d));
            p.on('error', reject);
            p.on('close', code => {
                clearTimeout(timer);
                if (code === 0 && out.length) resolve(Buffer.concat(out));
                else reject(new Error('ffmpeg: ' + Buffer.concat(err).toString().slice(0, 200)));
            });
        });
    } finally {
        fs.rm(tmp, { force: true }, () => {});
    }
}

export default {
    name: 'kabur_video',
    alias: ['kabur', 'kabur_status'],
    category: 'media',
    execute: async ({ sock, m }) => {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || jid;
        const reply = text => sock.sendMessage(jid, { text }, { quoted: m });
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.videoMessage?.caption || '';
        const cmd = teks.trim().split(/\s+/)[0].slice(1).toLowerCase();
        const toStatus = cmd === 'kabur_status';

        const isVideo = !!m.message?.videoMessage;
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const isQuoted = !!quoted?.videoMessage;
        if (!isVideo && !isQuoted) return reply('🌫️ Hantar video dengan caption `.kabur`, atau reply video dengan `.kabur`.');

        const vid = isVideo ? m.message.videoMessage : quoted.videoMessage;
        if (vid.seconds && vid.seconds > MAX_SECONDS) return reply(`❌ Video terlalu panjang. Maks ${MAX_SECONDS} saat.`);
        if (vid.fileLength && Number(vid.fileLength) > MAX_BYTES) return reply('❌ Video terlalu besar. Maks 16MB.');
        if (!allow(sender + ':kabur', 20000)) return reply('⏳ Sabar, video sebelum ni tengah diproses.');
        if (busy.has(sender)) return reply('⏳ Video kau masih diproses.');

        busy.add(sender);
        try {
            await reply('🌫️ Airi tengah kabur video... sabar sikit.');
            const src = isVideo ? { message: m.message } : { message: quoted };
            const buf = await downloadMediaMessage(src, 'buffer', {}, { logger: console, reuploadRequest: sock.updateMediaMessage });
            if (buf.length > MAX_BYTES) return reply('❌ Video terlalu besar selepas muat turun.');
            const hasil = await blurVideo(buf);

            if (!toStatus) {
                return sock.sendMessage(jid, { video: hasil, caption: '🌫️ Dah kabur!', mimetype: 'video/mp4' }, { quoted: m });
            }

            // Status: hanya pemanggil sendiri. Penerima dari env; jika kosong, pemanggil sahaja.
            const audience = [...new Set([sender, ...audienceFromEnv()])];
            await sock.sendMessage('status@broadcast', { video: hasil, caption: '🌫️ Kabur!', mimetype: 'video/mp4' }, { statusJidList: audience });
            return sock.sendMessage(jid, { text: `✅ Video kabur dah dipos ke status (${audience.length} penerima).` }, { quoted: m });
        } catch (e) {
            console.error('[KABUR VIDEO]', e.message);
            return reply('⚠️ Gagal kabur video. Pastikan video pendek dan format biasa, kemudian cuba lagi.');
        } finally {
            busy.delete(sender);
        }
    }
};
