import { musimTick, musimSemasa } from '../lib/musimkerja.js';

// 🌦️ .musim  -> tunjuk musim kerja yang sedang berjalan (muncul sendiri, bukan command)
export default {
    name: 'musim_kerja',
    alias: ['musim_sekarang'],
    category: 'kerja',
    execute: async ({ sock, m }) => {
        const jid = m.key.remoteJid;
        const s = musimSemasa();
        if (!s) return sock.sendMessage(jid, { text: '🌤️ Tiada musim kerja sekarang. Musim akan muncul sendiri bila tiba masanya.' }, { quoted: m });
        const baki = Math.max(0, Math.ceil((s.tamat - Date.now()) / 60e3));
        return sock.sendMessage(jid, { text: `${s.nama}\n${s.ket}\nKerja bonus: ${s.kerja.join(', ')} (x${s.mul})\nTinggal ${baki} minit.` }, { quoted: m });
    }
};
