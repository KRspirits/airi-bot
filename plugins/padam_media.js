import { isOwnerMsg } from '../config.js';
import { padamSemuaMedia } from '../lib/mediaSimpan.js';

// 🗑️ OWNER: padam semua gambar & klip yang bot dah hantar (sekarang juga).
export default {
    name: 'padam_media',
    alias: [],
    execute: async ({ sock, m }) => {
        const jid = m.key.remoteJid;
        if (!isOwnerMsg(m)) return;
        const bil = await padamSemuaMedia(sock);
        return sock.sendMessage(jid, { text: `🗑️ ${bil} gambar & klip dipadam.` }, { quoted: m });
    },
};
