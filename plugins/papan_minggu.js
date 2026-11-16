import { papanSemasa, teksPapan } from '../lib/leaderboard.js';

// 🏅 .papan_minggu - tunjuk papan semasa (tangkapan, kekayaan, aktiviti).
export default {
    name: 'papan_minggu',
    alias: ['papan_mingguan', 'lb_minggu'],
    category: 'info',
    execute: async ({ sock, m }) => {
        const jid = m.key.remoteJid;
        const data = await papanSemasa(sock, jid);
        return sock.sendMessage(jid, { text: teksPapan(data, 'PAPAN MINGGUAN · SEMASA') }, { quoted: m });
    }
};
