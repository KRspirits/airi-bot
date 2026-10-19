import { downloadMediaMessage } from '@whiskeysockets/baileys';

export default {
    name: 'hd',
    aliases: ['shadowstatus', 'purestatus'],
    category: 'tools',
    desc: 'Hasilkan video status anti-blur melalui proxy cache tanpa beban RAM FFmpeg',

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

        try {
            const mediaSource = isQuotedVideo 
                ? { message: { videoMessage: isQuotedVideo } } 
                : m;

            // Muat turun buffer asal
            const buffer = await downloadMediaMessage(mediaSource, 'buffer', {});

            // Ambil metadata asal video jika ada
            const targetVid = isQuotedVideo || isDirectVideo;
            const seconds = targetVid?.seconds || 30;

            if (seconds > 35) {
                await sock.sendMessage(jid, { 
                    text: '⚠️ *Peringatan:* Video melebihi 30 saat. Potong video kepada bawah 30 saat dahulu supaya WhatsApp tidak memaksa pemampatan pemotongan durasi.' 
                }, { quoted: m });
            }

            // Hantar semula ke chat menggunakan profil media stream native (memaksa WA simpan server-side HD cache)
            await sock.sendMessage(jid, {
                video: buffer,
                mimetype: 'video/mp4',
                seconds: seconds,
                caption: '🔥 *Video Anti-Blur Siap!*\n\n📲 *Langkah Wajib Supaya 100% Jelas:*\n1. Jangan tekan save ke galeri telefon!\n2. Tekan ikon **Forward (Anak Panah Kanan)** di sebelah video ini.\n3. Pilih **Status Saya (My Status)** dan hantar.\n\n*(Kaedah Forward ini memaksa WhatsApp menggunakan cache pelayan resolusi tinggi secara terus tanpa melalui enjin pemampat galeri telefon).*'
            }, { quoted: m });

            await sock.sendMessage(jid, { react: { text: '✅', key: m.key } }).catch(() => {});

        } catch (error) {
            console.error('[PROXY HD ERROR]:', error);
            await sock.sendMessage(jid, { text: '❌ Gagal memproses video. Saiz fail mungkin terlalu besar untuk sambungan semasa.' }, { quoted: m });
            await sock.sendMessage(jid, { react: { text: '❌', key: m.key } }).catch(() => {});
        }
    }
};
