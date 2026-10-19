import { downloadMediaMessage } from '@whiskeysockets/baileys';

export default {
    name: 'hd',
    aliases: ['shadowstatus', 'purestatus', 'status'],
    category: 'tools',
    desc: 'Pos video terus ke WhatsApp Status tanpa transcode FFmpeg (Zero-Transcode Passthrough)',

    async execute({ sock, m, user, db, args }) {
        const jid = m.key.remoteJid;
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const isQuotedVideo = quoted?.videoMessage;
        const isDirectVideo = m.message?.videoMessage;

        if (!isDirectVideo && !isQuotedVideo) {
            return sock.sendMessage(jid, {
                text: '⚠️ *Cara Guna:*\nReply mana-mana video dengan `.hd` atau hantar video bersama caption `.hd`'
            }, { quoted: m });
        }

        await sock.sendMessage(jid, { react: { text: '⚡', key: m.key } }).catch(() => {});

        try {
            const mediaSource = isQuotedVideo 
                ? { message: { videoMessage: isQuotedVideo } } 
                : m;

            // Muat turun terus buffer asal tanpa ubah sebarang format
            const buffer = await downloadMediaMessage(mediaSource, 'buffer', {});

            // Ambil kapsyen asal jika ada
            const rawCaption = isQuotedVideo 
                ? (isQuotedVideo.caption || '') 
                : (isDirectVideo.caption || '');
            
            // Bersihkan arahan bot (.hd / .status) daripada kapsyen
            const cleanCaption = rawCaption.replace(/^[.\/#!]?(hd|shadowstatus|purestatus|status)\s*/i, '').trim();

            // Dapatkan senarai kenalan untuk penghantaran status sah
            let statusJidList = [];
            try {
                if (sock.chats) {
                    statusJidList = Object.keys(sock.chats).filter(c => c.endsWith('@s.whatsapp.net'));
                }
            } catch (e) {}

            // Pos terus ke Status WhatsApp secara Native Passthrough
            await sock.sendMessage('status@broadcast', {
                video: buffer,
                caption: cleanCaption || ''
            }, {
                statusJidList: statusJidList.length ? statusJidList : undefined
            });

            // Beri maklum balas kepada pengguna
            await sock.sendMessage(jid, {
                text: '✅ *Berjaya Dipos ke Status WhatsApp!*\n\n🚀 Video telah dimuat naik terus dalam kualiti asal tanpa melalui pemampatan galeri telefon.',
            }, { quoted: m });

            await sock.sendMessage(jid, { react: { text: '✅', key: m.key } }).catch(() => {});

        } catch (error) {
            console.error('[PASSTHROUGH ERROR]:', error);
            await sock.sendMessage(jid, { text: '❌ Ralat ketika memuat naik video ke status.' }, { quoted: m });
            await sock.sendMessage(jid, { react: { text: '❌', key: m.key } }).catch(() => {});
        }
    }
};
