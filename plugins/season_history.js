import { seasonHistory } from '../lib/season.js';

// 🏆 SEJARAH MUSIM - tunjuk pemenang musim-musim lepas (dikekalkan selepas reset).
export default {
    name: 'season_history',
    alias: ['sejarah_musim', 'juara_musim'],
    category: 'info',
    execute: async ({ sock, m }) => {
        const jid = m.key.remoteJid;
        const h = await seasonHistory();
        if (!h.length) return sock.sendMessage(jid, { text: '🏆 Belum ada musim yang tamat lagi.' }, { quoted: m });
        const teks = h.slice(0, 5).map((musim, i) => {
            const tarikh = new Date(musim.t).toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kuala_Lumpur' });
            const pemenang = musim.winners.length
                ? musim.winners.map((w, k) => `${['🥇', '🥈', '🥉'][k]} ${w.name} (+RM ${w.gain.toLocaleString('en-US')})`).join('\n')
                : 'Tiada pemenang';
            return `*Season ${musim.musim ?? (h.length - i)} · ${tarikh}*\n${pemenang}`;
        }).join('\n\n');
        return sock.sendMessage(jid, { text: `🏆 *SEJARAH MUSIM*\n\n${teks}` }, { quoted: m });
    }
};
